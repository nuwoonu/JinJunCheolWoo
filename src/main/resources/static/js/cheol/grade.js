// Grade API URL
const gradeUrl = '/grades';

// 점수에 따른 등급 계산
const calculateGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'F';
};

// 합격/불합격 판정
const getResult = (score) => {
    return score >= 40 ? 'Pass' : 'Fail';
};

// 결과 배지 HTML 생성
const getResultBadge = (score) => {
    const result = getResult(score);
    if (result === 'Pass') {
        return `<span class="bg-success-100 text-success-600 px-16 py-2 radius-4 fw-medium text-sm">Pass</span>`;
    } else {
        return `<span class="bg-danger-100 text-danger-600 px-16 py-2 radius-4 fw-medium text-sm">Fail</span>`;
    }
};

// 학생별 전체 성적 가져오기
const getGradesByStudent = (studentId) => {
    fetch(`${gradeUrl}/student/${studentId}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`에러 발생: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('학생 성적 데이터:', data);
            renderAllGrades(data);
        })
        .catch(err => {
            console.error('성적 조회 실패:', err);
            showNoDataMessage();
        });
};

// 모든 성적 렌더링 (학기/시험유형별 분류)
const renderAllGrades = (grades) => {
    // 1학기 중간고사
    const firstMidterm = grades.filter(g => g.semester === 'FIRST' && g.examType === 'MIDTERMTEST');
    renderGradeTable('firstSemesterMidterm', firstMidterm);

    // 1학기 기말고사
    const firstFinal = grades.filter(g => g.semester === 'FIRST' && g.examType === 'FINALTEST');
    renderGradeTable('firstSemesterFinal', firstFinal);

    // 1학기 수행평가
    const firstPerformance = grades.filter(g => g.semester === 'FIRST' && g.examType === 'PERFORMANCEASSESSMENT');
    renderGradeTable('firstSemesterPerformance', firstPerformance);

    // 2학기 중간고사
    const secondMidterm = grades.filter(g => g.semester === 'SECOND' && g.examType === 'MIDTERMTEST');
    renderGradeTable('secondSemesterMidterm', secondMidterm);

    // 2학기 기말고사
    const secondFinal = grades.filter(g => g.semester === 'SECOND' && g.examType === 'FINALTEST');
    renderGradeTable('secondSemesterFinal', secondFinal);

    // 2학기 수행평가
    const secondPerformance = grades.filter(g => g.semester === 'SECOND' && g.examType === 'PERFORMANCEASSESSMENT');
    renderGradeTable('secondSemesterPerformance', secondPerformance);

    // 기존 테이블 ID도 지원 (호환성)
    const firstSemester = grades.filter(g => g.semester === 'FIRST');
    renderGradeTable('firstSemesterTable', firstSemester);

    const secondSemester = grades.filter(g => g.semester === 'SECOND');
    renderGradeTable('secondSemesterTable', secondSemester);
};

// 테이블에 성적 데이터 렌더링
const renderGradeTable = (tableId, grades) => {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tableBody = table.querySelector('tbody');
    if (!tableBody) return;

    if (!grades || grades.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary-light py-20">
                    등록된 성적이 없습니다.
                </td>
            </tr>
        `;
        updateTableFooter(table, 0, 0);
        return;
    }

    let html = '';
    let totalScore = 0;
    const maxMarks = 100;
    const minMarks = 40;

    grades.forEach(grade => {
        const gradeLevel = calculateGrade(grade.score);
        totalScore += grade.score;

        html += `
            <tr data-grade-id="${grade.id}">
                <td class="text-start">${grade.subjectName}</td>
                <td class="text-start">${maxMarks}.00</td>
                <td class="text-start">${minMarks}.00</td>
                <td class="text-start">${grade.score}</td>
                <td class="text-start">${gradeLevel}</td>
                <td class="text-start">${getResultBadge(grade.score)}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    updateTableFooter(table, grades.length, totalScore);
};

// 테이블 푸터 업데이트
const updateTableFooter = (table, subjectCount, totalScore) => {
    const tfoot = table.querySelector('tfoot');
    if (!tfoot) return;

    const avgScore = subjectCount > 0 ? (totalScore / subjectCount) : 0;
    const overallGrade = calculateGrade(avgScore);
    const overallResult = getResult(avgScore);

    const footerCells = tfoot.querySelectorAll('td');
    if (footerCells.length >= 6) {
        footerCells[0].innerHTML = `Rank: -`;
        footerCells[1].innerHTML = `Total: ${subjectCount * 100}`;
        footerCells[2].innerHTML = ``;
        footerCells[3].innerHTML = `Total Obtain Marks: ${totalScore}`;
        footerCells[4].innerHTML = `Grade: ${overallGrade}`;
        footerCells[5].innerHTML = `Results: ${overallResult}`;
    }
};

// 데이터 없음 메시지 표시
const showNoDataMessage = () => {
    const examTables = document.querySelectorAll('#pills-exam table tbody');
    examTables.forEach(tbody => {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary-light py-20">
                    성적 데이터를 불러올 수 없습니다.
                </td>
            </tr>
        `;
    });
};

// 과목별 성적 조회
const getGradesBySubject = (subjectCode) => {
    return fetch(`${gradeUrl}/subject/${subjectCode}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`에러 발생: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log(`과목(${subjectCode}) 성적:`, data);
            return data;
        })
        .catch(err => {
            console.error('과목별 성적 조회 실패:', err);
        });
};

// 전체 성적 조회
const getAllGrades = () => {
    return fetch(gradeUrl)
        .then(res => {
            if (!res.ok) {
                throw new Error(`에러 발생: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('전체 성적:', data);
            return data;
        })
        .catch(err => {
            console.error('전체 성적 조회 실패:', err);
        });
};

// 학기/학년별 성적 조회
const getGradesBySemesterAndYear = (semester, year) => {
    return fetch(`${gradeUrl}/search?semester=${semester}&year=${year}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`에러 발생: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log(`${year} ${semester}학기 성적:`, data);
            return data;
        })
        .catch(err => {
            console.error('학기별 성적 조회 실패:', err);
        });
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // studentId가 페이지에 정의되어 있으면 해당 학생 성적 로드
    if (typeof studentId !== 'undefined' && studentId) {
        console.log('학생 성적 로드 시작, studentId:', studentId);
        getGradesByStudent(studentId);
    }
});
