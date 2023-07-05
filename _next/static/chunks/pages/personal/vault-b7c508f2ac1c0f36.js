(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[972],{7444:function(e,s,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/personal/vault",function(){return n(4760)}])},979:function(e,s,n){"use strict";var t=n(5893),a=n(1163);s.Z={logo:(0,t.jsx)("strong",{children:"Dashlane CLI"}),project:{link:"https://github.com/Dashlane/dashlane-cli"},docsRepositoryBase:"https://github.com/Dashlane/dashlane-cli/blob/master/documentation",banner:{key:"2.0-release",text:(0,t.jsx)("a",{href:"https://github.com/Dashlane/dashlane-cli/releases",target:"_blank",children:"\uD83D\uDCC2 Download Dashlane CLI builds for Macos, Windows and Linux here →"})},footer:{text:(0,t.jsxs)("span",{children:["Apache $",new Date().getFullYear()," \xa9 Dashlane, Inc."]})},useNextSeoProps(){let{asPath:e}=(0,a.useRouter)();if("/"!==e)return{titleTemplate:"%s - Dashlane CLI"}}}},4760:function(e,s,n){"use strict";n.r(s);var t=n(5893),a=n(2673),i=n(1712),l=n(979);n(9966);var r=n(1151);n(5675);let o={MDXContent:function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},{wrapper:s}=Object.assign({},(0,r.ah)(),e.components);return s?(0,t.jsx)(s,{...e,children:(0,t.jsx)(c,{...e})}):c(e)},pageOpts:{filePath:"pages/personal/vault.mdx",route:"/personal/vault",headings:[{depth:1,value:"Accessing your Vault",id:"accessing-your-vault"},{depth:2,value:"Get a password",id:"get-a-password"},{depth:2,value:"Generate an OTP code",id:"generate-an-otp-code"},{depth:2,value:"Get a secure note",id:"get-a-secure-note"},{depth:2,value:"Options",id:"options"}],pageMap:[{kind:"Meta",data:{index:"Introduction",personal:"Personal",business:"Business"}},{kind:"Folder",name:"business",route:"/business",children:[{kind:"Meta",data:{index:"Get Started","audit-logs":"Audit Logs",members:"Members"}},{kind:"MdxPage",name:"audit-logs",route:"/business/audit-logs"},{kind:"MdxPage",name:"index",route:"/business"},{kind:"MdxPage",name:"members",route:"/business/members"}]},{kind:"MdxPage",name:"index",route:"/"},{kind:"Folder",name:"personal",route:"/personal",children:[{kind:"Meta",data:{index:"Get Started",authentication:"Authentication",vault:"Accessing your Vault"}},{kind:"MdxPage",name:"authentication",route:"/personal/authentication"},{kind:"MdxPage",name:"index",route:"/personal"},{kind:"MdxPage",name:"vault",route:"/personal/vault"}]}],flexsearch:{codeblocks:!0},title:"Accessing your Vault"},pageNextRoute:"/personal/vault",nextraLayout:i.ZP,themeConfig:l.Z};function c(e){let s=Object.assign({h1:"h1",h2:"h2",pre:"pre",code:"code",span:"span",p:"p"},(0,r.ah)(),e.components);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(s.h1,{children:"Accessing your Vault"}),"\n",(0,t.jsx)(s.h2,{id:"get-a-password",children:"Get a password"}),"\n",(0,t.jsx)(s.pre,{"data-language":"sh","data-theme":"default",children:(0,t.jsxs)(s.code,{"data-language":"sh","data-theme":"default",children:[(0,t.jsxs)(s.span,{className:"line",children:[(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-function)"},children:"dcli"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"p"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"mywebsite"})]}),"\n",(0,t.jsx)(s.span,{className:"line",children:(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-comment)"},children:"# will return any entry for which either the url or the title matches mywebsite"})}),"\n",(0,t.jsx)(s.span,{className:"line",children:" "}),"\n",(0,t.jsxs)(s.span,{className:"line",children:[(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-function)"},children:"dcli"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"p"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"id=xxxxxx"})]}),"\n",(0,t.jsx)(s.span,{className:"line",children:(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-comment)"},children:"# will return any entry for which the id matches xxxxxx"})}),"\n",(0,t.jsx)(s.span,{className:"line",children:" "}),"\n",(0,t.jsxs)(s.span,{className:"line",children:[(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-function)"},children:"dcli"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"p"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"url=someurl"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"title=mytitle"})]}),"\n",(0,t.jsx)(s.span,{className:"line",children:(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-comment)"},children:"# will return any entry for which the url matches someurl, or the title matches mytitle"})}),"\n",(0,t.jsx)(s.span,{className:"line",children:" "}),"\n",(0,t.jsxs)(s.span,{className:"line",children:[(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-function)"},children:"dcli"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"p"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"url,title=mywebsite"})]}),"\n",(0,t.jsx)(s.span,{className:"line",children:(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-comment)"},children:"# will return any entry for which either the url or the title matches mywebsite"})})]})}),"\n",(0,t.jsxs)(s.p,{children:["Note: You can select a different output for passwords among ",(0,t.jsx)(s.code,{children:"clipboard, password, json"}),". The JSON option outputs all the matching credentials."]}),"\n",(0,t.jsx)(s.h2,{id:"generate-an-otp-code",children:"Generate an OTP code"}),"\n",(0,t.jsx)(s.pre,{"data-language":"sh","data-theme":"default",children:(0,t.jsx)(s.code,{"data-language":"sh","data-theme":"default",children:(0,t.jsxs)(s.span,{className:"line",children:[(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-function)"},children:"dcli"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"otp"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" [filters]"})]})})}),"\n",(0,t.jsx)(s.h2,{id:"get-a-secure-note",children:"Get a secure note"}),"\n",(0,t.jsx)(s.pre,{"data-language":"sh","data-theme":"default",children:(0,t.jsx)(s.code,{"data-language":"sh","data-theme":"default",children:(0,t.jsxs)(s.span,{className:"line",children:[(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-function)"},children:"dcli"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"note"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" [titleFilter]"})]})})}),"\n",(0,t.jsx)(s.h2,{id:"options",children:"Options"}),"\n",(0,t.jsx)(s.p,{children:"By default an automatic synchronization is performed once per hour.\nYou can change this behavior with the following command:"}),"\n",(0,t.jsx)(s.pre,{"data-language":"sh","data-theme":"default",children:(0,t.jsx)(s.code,{"data-language":"sh","data-theme":"default",children:(0,t.jsxs)(s.span,{className:"line",children:[(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-function)"},children:"dcli"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"configure"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-string)"},children:"disable-auto-sync"}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-color-text)"},children:" "}),(0,t.jsx)(s.span,{style:{color:"var(--shiki-token-constant)"},children:"true"})]})})})]})}s.default=(0,a.j)(o)}},function(e){e.O(0,[774,568,888,179],function(){return e(e.s=7444)}),_N_E=e.O()}]);