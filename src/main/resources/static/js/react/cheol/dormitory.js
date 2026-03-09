import{r as l,j as e,c as A}from"../shared/client-Cmjl_fXq.js";/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=(...i)=>i.filter((r,c,t)=>!!r&&r.trim()!==""&&t.indexOf(r)===c).join(" ").trim();/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=i=>i.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=i=>i.replace(/^([A-Z])|[\s-_]+(\w)/g,(r,c,t)=>t?t.toUpperCase():c.toLowerCase());/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=i=>{const r=U(i);return r.charAt(0).toUpperCase()+r.slice(1)};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var _={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=i=>{for(const r in i)if(r.startsWith("aria-")||r==="role"||r==="title")return!0;return!1};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=l.forwardRef(({color:i="currentColor",size:r=24,strokeWidth:c=2,absoluteStrokeWidth:t,className:u="",children:d,iconNode:p,...m},f)=>l.createElement("svg",{ref:f,..._,width:r,height:r,stroke:i,strokeWidth:t?Number(c)*24/Number(r):c,className:E("lucide",u),...!d&&!L(m)&&{"aria-hidden":"true"},...m},[...p.map(([y,h])=>l.createElement(y,h)),...Array.isArray(d)?d:[d]]));/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=(i,r)=>{const c=l.forwardRef(({className:t,...u},d)=>l.createElement(I,{ref:d,iconNode:r,className:E(`lucide-${D(k(i))}`,`lucide-${i}`,t),...u}));return c.displayName=k(i),c};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=[["path",{d:"M2 4v16",key:"vw9hq8"}],["path",{d:"M2 8h18a2 2 0 0 1 2 2v10",key:"1dgv2r"}],["path",{d:"M2 17h20",key:"18nfp3"}],["path",{d:"M6 8v9",key:"1yriud"}]],O=g("bed",R);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],C=g("building-2",T);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],P=g("user-minus",F);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],q=g("user-plus",H);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],K=g("user",z),V=()=>{const[i]=l.useState(["1동","2동","3동"]),[r,c]=l.useState(null),[t,u]=l.useState(null),[d,p]=l.useState(null),[m,f]=l.useState(null),[y,h]=l.useState(!1),b=async s=>{h(!0);try{const a=await(await fetch(`/api/dormitories/buildings/${s}`)).json();p(a)}catch(n){console.error("Failed to fetch building data:",n)}finally{h(!1)}},j=async(s,n,a)=>{h(!0);try{const x=await(await fetch(`/api/dormitories/rooms?building=${s}&floor=${n}&roomNumber=${a}`)).json();f(x)}catch(o){console.error("Failed to fetch room details:",o)}finally{h(!1)}},M=async(s,n)=>{if(t)try{const a=await fetch("/api/dormitories/assign",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId:s,building:t.building,floor:t.floor,roomNumber:t.roomNumber,bedNumber:n.bedNumber})});if(a.ok)j(t.building,t.floor,t.roomNumber),r&&b(r);else{const o=await a.text();alert(o)}}catch(a){console.error("Failed to assign student:",a),alert("배정에 실패했습니다.")}},N=async s=>{if(confirm("기숙사 배정을 해제하시겠습니까?")&&t)try{(await fetch(`/api/dormitories/students/${s}`,{method:"DELETE"})).ok&&(j(t.building,t.floor,t.roomNumber),r&&b(r))}catch(n){console.error("Failed to unassign student:",n)}};l.useEffect(()=>{r&&(b(r),u(null),f(null))},[r]),l.useEffect(()=>{t&&j(t.building,t.floor,t.roomNumber)},[t]);const w=s=>({SINGLE:"1인실",DOUBLE:"2인실",QUADRUPLE:"4인실"})[s]||s,S=s=>{const n=s.filter(o=>o.studentNames.length>0).length,a=s.length;return n===0?"bg-green-100 border-green-400 hover:bg-green-200":n===a?"bg-red-100 border-red-400 hover:bg-red-200":"bg-yellow-100 border-yellow-400 hover:bg-yellow-200"},v=({bed:s,onAssign:n,onUnassign:a})=>{const o=s.studentNames&&s.studentNames.length>0;return e.jsxs("div",{className:`border-2 rounded-lg p-4 w-36 h-40 flex flex-col items-center justify-between ${o?"bg-blue-50 border-blue-400":"bg-gray-50 border-gray-300"}`,children:[e.jsxs("div",{className:"flex flex-col items-center flex-grow justify-center",children:[e.jsx(O,{className:`w-12 h-12 mb-2 ${o?"text-blue-600":"text-gray-400"}`}),e.jsxs("div",{className:"text-xs text-gray-600 mb-1",children:["침대 ",s.bedNumber]}),o?e.jsxs(e.Fragment,{children:[e.jsx(K,{className:"w-4 h-4 text-blue-600 mb-1"}),e.jsx("div",{className:"text-sm font-semibold text-center",children:s.studentNames[0]})]}):e.jsx("div",{className:"text-sm text-gray-400",children:"빈 침대"})]}),o?e.jsxs("button",{onClick:()=>s.studentId&&a(s.studentId),className:"mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 flex items-center gap-1",children:[e.jsx(P,{size:12}),"해제"]}):e.jsxs("button",{onClick:()=>n(s),className:"mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 flex items-center gap-1",children:[e.jsx(q,{size:12}),"배정"]})]})},B=s=>{const n=s.length,a=o=>{const x=prompt("학생 ID를 입력하세요:");x&&M(x,o)};if(n===1)return e.jsx("div",{className:"flex justify-center",children:e.jsx(v,{bed:s[0],onAssign:a,onUnassign:N})});if(n===2)return e.jsx("div",{className:"flex gap-4 justify-center",children:s.map((o,x)=>e.jsx(v,{bed:o,onAssign:a,onUnassign:N},x))});if(n===4)return e.jsx("div",{className:"grid grid-cols-2 gap-4",children:s.map((o,x)=>e.jsx(v,{bed:o,onAssign:a,onUnassign:N},x))})};return e.jsxs("div",{className:"w-full min-h-screen bg-gray-100 p-6",children:[e.jsxs("h1",{className:"text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2",children:[e.jsx(C,{size:32}),"기숙사 관리 시스템"]}),e.jsxs("div",{className:"flex gap-6",children:[e.jsxs("div",{className:"bg-white rounded-lg shadow-md p-6 w-64",children:[e.jsx("h2",{className:"text-xl font-semibold mb-4",children:"건물 선택"}),e.jsx("div",{className:"space-y-3",children:i.map(s=>e.jsxs("button",{onClick:()=>c(s),className:`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${r===s?"bg-blue-600 text-white shadow-lg":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`,children:[e.jsx(C,{size:20}),s]},s))})]}),r&&d&&e.jsxs("div",{className:"bg-white rounded-lg shadow-md p-6 flex-1",children:[e.jsxs("h2",{className:"text-xl font-semibold mb-4",children:[r," 단면도"]}),y?e.jsx("div",{className:"text-center py-20",children:"로딩 중..."}):e.jsx("div",{className:"space-y-4",children:[5,4,3,2,1].map(s=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"w-16 text-center font-bold text-gray-700",children:[s,"층"]}),e.jsx("div",{className:"flex gap-2 flex-wrap",children:d[s]&&Object.entries(d[s]).map(([n,a])=>e.jsxs("button",{onClick:()=>u({building:r,floor:s,roomNumber:n}),className:`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${S(a)} ${(t==null?void 0:t.roomNumber)===n&&(t==null?void 0:t.floor)===s?"ring-4 ring-blue-300":""}`,children:[e.jsxs("div",{className:"text-sm",children:[n,"호"]}),e.jsx("div",{className:"text-xs text-gray-600",children:w(a[0].roomType)}),e.jsxs("div",{className:"text-xs text-gray-500",children:[a.filter(o=>o.studentNames.length>0).length,"/",a.length]})]},n))})]},s))}),e.jsxs("div",{className:"mt-6 flex gap-4 text-sm",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-4 h-4 bg-green-100 border-2 border-green-400 rounded"}),e.jsx("span",{children:"공실"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"}),e.jsx("span",{children:"일부 배정"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-4 h-4 bg-red-100 border-2 border-red-400 rounded"}),e.jsx("span",{children:"만실"})]})]})]}),t&&m&&e.jsxs("div",{className:"bg-white rounded-lg shadow-md p-6 w-96",children:[e.jsxs("h2",{className:"text-xl font-semibold mb-4",children:[t.building," ",t.floor,"층 ",t.roomNumber,"호"]}),e.jsxs("div",{className:"mb-4 text-sm text-gray-600",children:[w(m[0].roomType),e.jsxs("span",{className:"ml-2",children:["(",m.filter(s=>s.studentNames.length>0).length,"/",m.length," 배정)"]})]}),B(m)]})]})]})},$=document.getElementById("dormitory-root");$&&A($).render(e.jsx(l.StrictMode,{children:e.jsx(V,{})}));
