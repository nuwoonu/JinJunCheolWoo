import { useState } from 'react'

export interface SchoolSummary {
  id: number
  name: string
  schoolCode?: string
  schoolKind: string
  officeOfEducation: string
  address: string
  phoneNumber?: string
  homepage?: string
}

interface PageResponse {
  content: SchoolSummary[]
  totalPages: number
  totalElements: number
  number: number
}

type FetchFn = (params: {
  name?: string
  schoolKind?: string
  page: number
  size: number
  sort: string
}) => Promise<{ data: PageResponse }>

export function useSchoolSearch(fetchFn: FetchFn, size = 10) {
  const [name, setName] = useState('')
  const [schoolKind, setSchoolKind] = useState('')
  const [schools, setSchools] = useState<SchoolSummary[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const fetchSchools = (pageNum = 0) => {
    setLoading(true)
    fetchFn({
      name: name.trim() || undefined,
      schoolKind: schoolKind || undefined,
      page: pageNum,
      size,
      sort: 'name,asc',
    })
      .then((r) => {
        const data = r.data
        setSchools(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
        setPage(data.number)
        setSearched(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchSchools(0)
  }

  const reset = () => {
    setName('')
    setSchoolKind('')
    setSchools([])
    setTotalPages(0)
    setTotalElements(0)
    setPage(0)
    setSearched(false)
  }

  return {
    name, setName,
    schoolKind, setSchoolKind,
    schools,
    totalPages,
    totalElements,
    page,
    loading,
    searched,
    fetchSchools,
    handleSearch,
    reset,
  }
}
