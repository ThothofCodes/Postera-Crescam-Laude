import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{m as t}from"./chart-vendor-DMCXe9Uz.js";import{m as n,t as r}from"./react-vendor-fKtp4fAm.js";import{n as i,t as a}from"./api-DC1hBBFb.js";var o=e(t(),1),s=r(),c=()=>{let e=n(),[t,r]=(0,o.useState)(`faq`),[c,l]=(0,o.useState)(``),[u,d]=(0,o.useState)([]),[f,p]=(0,o.useState)([]),[m,h]=(0,o.useState)({subject:``,category:`general`,priority:`MEDIUM`,description:``}),[g,_]=(0,o.useState)(!1),[v,y]=(0,o.useState)(!1),[b,x]=(0,o.useState)(!0),[S,C]=(0,o.useState)(null),[w,T]=(0,o.useState)([]),[E,D]=(0,o.useState)([]),[O,k]=(0,o.useState)([]);return(0,o.useEffect)(()=>{(async()=>{try{x(!0);let e=await i.get(`/help/faq`);e.data.success&&(T(e.data.data),d(e.data.data));let t=await i.get(`/help/troubleshooting`);t.data.success&&D(t.data.data);let n=await i.get(`/help/knowledge-base`);if(n.data.success&&k(n.data.data),localStorage.getItem(`token`))try{let e=await a.get(`/help/tickets`);e.data.success&&p(e.data.data)}catch{console.log(`User not authenticated for tickets`)}}catch(e){console.error(`Error fetching help desk data:`,e)}finally{x(!1)}})()},[]),(0,o.useEffect)(()=>{let e=setTimeout(async()=>{if(c.trim()===``)d(w);else try{let e=await i.get(`/help/faq/search?q=${encodeURIComponent(c)}`);e.data.success?d(e.data.data):d(w.filter(e=>e.question.toLowerCase().includes(c.toLowerCase())||e.answer.toLowerCase().includes(c.toLowerCase())))}catch{d(w.filter(e=>e.question.toLowerCase().includes(c.toLowerCase())||e.answer.toLowerCase().includes(c.toLowerCase())))}},300);return()=>clearTimeout(e)},[c,w]),(0,s.jsxs)(`div`,{style:{padding:`2rem`,background:`var(--bg-void)`,minHeight:`100vh`,color:`var(--text-primary)`,fontFamily:`'Inter', sans-serif`},children:[(0,s.jsxs)(`div`,{style:{maxWidth:`1200px`,margin:`0 auto`,background:`var(--bg-panel)`,borderRadius:`12px`,padding:`2rem`,border:`1px solid rgba(244,241,234,0.1)`,boxShadow:`0 8px 32px #000000b3`},children:[(0,s.jsx)(`h1`,{style:{fontSize:`2rem`,margin:0,color:`var(--text-bright)`,fontWeight:700,marginBottom:`2rem`,textAlign:`center`,fontFamily:`'Poppins', sans-serif`},children:`Help Center`}),(0,s.jsxs)(`div`,{style:{display:`flex`,gap:`1rem`,marginBottom:`2rem`,flexWrap:`wrap`,justifyContent:`center`},children:[(0,s.jsx)(`button`,{onClick:()=>r(`faq`),style:{padding:`0.75rem 1.5rem`,background:t===`faq`?`var(--grad-btn-red)`:`transparent`,color:t===`faq`?`white`:`var(--text-secondary)`,border:`1px solid var(--border-white)`,borderRadius:`8px`,cursor:`pointer`,fontWeight:t===`faq`?`bold`:`normal`,transition:`all 0.2s ease`,fontFamily:`'Inter', sans-serif`},children:`Self-Help`}),(0,s.jsx)(`button`,{onClick:()=>r(`tickets`),style:{padding:`0.75rem 1.5rem`,background:t===`tickets`?`var(--grad-btn-red)`:`transparent`,color:t===`tickets`?`white`:`var(--text-secondary)`,border:`1px solid var(--border-white)`,borderRadius:`8px`,cursor:`pointer`,fontWeight:t===`tickets`?`bold`:`normal`,transition:`all 0.2s ease`,fontFamily:`'Inter', sans-serif`},children:`Support Tickets`}),(0,s.jsx)(`button`,{onClick:()=>r(`contact`),style:{padding:`0.75rem 1.5rem`,background:t===`contact`?`var(--grad-btn-red)`:`transparent`,color:t===`contact`?`white`:`var(--text-secondary)`,border:`1px solid var(--border-white)`,borderRadius:`8px`,cursor:`pointer`,fontWeight:t===`contact`?`bold`:`normal`,transition:`all 0.2s ease`,fontFamily:`'Inter', sans-serif`},children:`Contact Us`})]}),(0,s.jsxs)(`div`,{className:`help-container`,children:[t===`faq`&&(0,s.jsxs)(`div`,{className:`help-content`,children:[(0,s.jsx)(`div`,{className:`search-bar`,children:(0,s.jsx)(`input`,{type:`text`,placeholder:`Search for help...`,value:c,onChange:e=>l(e.target.value),className:`search-input`})}),(0,s.jsx)(`div`,{className:`faq-categories`,children:(0,s.jsxs)(`div`,{className:`category-buttons`,children:[(0,s.jsx)(`button`,{className:`category-btn ${t===`faq`?`active`:``}`,onClick:()=>r(`faq`),children:`All FAQs`}),(0,s.jsx)(`button`,{className:`category-btn ${t===`troubleshooting`?`active`:``}`,onClick:()=>r(`troubleshooting`),children:`Troubleshooting`}),(0,s.jsx)(`button`,{className:`category-btn ${t===`knowledge`?`active`:``}`,onClick:()=>r(`knowledge`),children:`Knowledge Base`})]})}),b?(0,s.jsx)(`div`,{className:`loading`,children:`Loading help resources...`}):t===`faq`&&(0,s.jsxs)(`div`,{className:`faq-section`,children:[(0,s.jsx)(`h2`,{children:`Frequently Asked Questions`}),(0,s.jsx)(`div`,{className:`faq-list`,children:u.map(e=>(0,s.jsxs)(`div`,{className:`faq-item`,children:[(0,s.jsx)(`div`,{className:`faq-question`,children:(0,s.jsx)(`h3`,{children:e.question})}),(0,s.jsx)(`div`,{className:`faq-answer`,children:(0,s.jsx)(`p`,{children:e.answer})})]},e.id))})]}),t===`troubleshooting`&&(0,s.jsxs)(`div`,{className:`troubleshooting-section`,children:[(0,s.jsx)(`h2`,{children:`Troubleshooting Guides`}),(0,s.jsx)(`div`,{className:`guides-list`,children:E.map(e=>(0,s.jsxs)(`div`,{className:`guide-item`,children:[(0,s.jsx)(`h3`,{children:e.title}),(0,s.jsx)(`ol`,{className:`steps-list`,children:e.steps.map((e,t)=>(0,s.jsx)(`li`,{children:e},t))})]},e.id))})]}),t===`knowledge`&&(0,s.jsxs)(`div`,{className:`knowledge-section`,children:[(0,s.jsx)(`h2`,{children:`Knowledge Base`}),(0,s.jsx)(`div`,{className:`articles-list`,children:O.map(e=>(0,s.jsxs)(`div`,{className:`article-item`,children:[(0,s.jsx)(`h3`,{children:e.title}),(0,s.jsx)(`p`,{children:e.content}),(0,s.jsx)(`div`,{className:`tags`,children:e.tags.map((e,t)=>(0,s.jsx)(`span`,{className:`tag`,children:e},t))})]},e.id))})]})]}),t===`tickets`&&(0,s.jsxs)(`div`,{className:`tickets-content`,children:[(0,s.jsx)(`div`,{className:`ticket-actions`,children:(0,s.jsx)(`button`,{className:`btn-primary`,onClick:()=>y(!v),children:v?`Cancel`:`Create New Ticket`})}),v&&(0,s.jsxs)(`div`,{className:`ticket-form`,children:[(0,s.jsx)(`h3`,{children:`Create Support Ticket`}),(0,s.jsxs)(`form`,{onSubmit:async e=>{e.preventDefault(),_(!0);try{let e=await i.post(`/tickets`,{title:m.subject,description:m.description,category:m.category,priority:m.priority?.toUpperCase()||`MEDIUM`,departmentSlug:`general`});if(e.data.success){let t={id:e.data.ticketId||Date.now(),subject:m.subject,category:m.category,priority:m.priority,description:m.description,status:`open`,createdAt:new Date().toISOString(),ticketId:e.data.ticketId};p(e=>[t,...e]),C(e.data),h({subject:``,category:`general`,priority:`MEDIUM`,description:``}),y(!1)}else alert(e.data.message||`Failed to submit ticket. Please try again.`)}catch(e){console.error(`Error submitting ticket:`,e),alert(`Failed to submit ticket. Please try again.`)}finally{_(!1)}},children:[(0,s.jsxs)(`div`,{className:`form-group`,children:[(0,s.jsx)(`label`,{htmlFor:`subject`,children:`Subject *`}),(0,s.jsx)(`input`,{type:`text`,id:`subject`,value:m.subject,onChange:e=>h({...m,subject:e.target.value}),required:!0})]}),(0,s.jsxs)(`div`,{className:`form-row`,children:[(0,s.jsxs)(`div`,{className:`form-group`,children:[(0,s.jsx)(`label`,{htmlFor:`category`,children:`Category`}),(0,s.jsxs)(`select`,{id:`category`,value:m.category,onChange:e=>h({...m,category:e.target.value}),children:[(0,s.jsx)(`option`,{value:`general`,children:`General Inquiry`}),(0,s.jsx)(`option`,{value:`billing`,children:`Billing`}),(0,s.jsx)(`option`,{value:`technical`,children:`Technical Issue`}),(0,s.jsx)(`option`,{value:`account`,children:`Account`}),(0,s.jsx)(`option`,{value:`orders`,children:`Orders`}),(0,s.jsx)(`option`,{value:`other`,children:`Other`})]})]}),(0,s.jsxs)(`div`,{className:`form-group`,children:[(0,s.jsx)(`label`,{htmlFor:`priority`,children:`Priority`}),(0,s.jsxs)(`select`,{id:`priority`,value:m.priority,onChange:e=>h({...m,priority:e.target.value}),children:[(0,s.jsx)(`option`,{value:`LOW`,children:`Low`}),(0,s.jsx)(`option`,{value:`MEDIUM`,children:`Medium`}),(0,s.jsx)(`option`,{value:`HIGH`,children:`High`}),(0,s.jsx)(`option`,{value:`CRITICAL`,children:`Urgent`})]})]})]}),(0,s.jsxs)(`div`,{className:`form-group`,children:[(0,s.jsx)(`label`,{htmlFor:`description`,children:`Description *`}),(0,s.jsx)(`textarea`,{id:`description`,rows:`5`,value:m.description,onChange:e=>h({...m,description:e.target.value}),required:!0})]}),(0,s.jsx)(`button`,{type:`submit`,className:`btn-primary`,disabled:g,children:g?`Submitting...`:`Submit Ticket`})]})]}),(0,s.jsxs)(`div`,{className:`tickets-list`,children:[(0,s.jsx)(`h3`,{children:`Your Support Tickets`}),f.length===0?(0,s.jsxs)(`div`,{className:`no-tickets`,children:[(0,s.jsx)(`p`,{children:`You haven't submitted any support tickets yet.`}),(0,s.jsx)(`p`,{children:`Need help? Create a new ticket to get assistance from our support team.`})]}):(0,s.jsx)(`div`,{className:`ticket-items`,children:f.map(e=>(0,s.jsxs)(`div`,{className:`ticket-item`,children:[(0,s.jsxs)(`div`,{className:`ticket-header`,children:[(0,s.jsx)(`h4`,{children:e.subject}),(0,s.jsx)(`span`,{className:`status-badge ${e.status}`,children:e.status})]}),(0,s.jsxs)(`div`,{className:`ticket-details`,children:[(0,s.jsxs)(`p`,{children:[(0,s.jsx)(`strong`,{children:`Category:`}),` `,e.category]}),(0,s.jsxs)(`p`,{children:[(0,s.jsx)(`strong`,{children:`Priority:`}),` `,e.priority]}),(0,s.jsxs)(`p`,{children:[(0,s.jsx)(`strong`,{children:`Description:`}),` `,e.description.substring(0,100),`...`]}),(0,s.jsxs)(`p`,{children:[(0,s.jsx)(`strong`,{children:`Created:`}),` `,new Date(e.createdAt).toLocaleDateString()]})]})]},e.id))})]})]}),t===`contact`&&(0,s.jsxs)(`div`,{className:`contact-content`,children:[(0,s.jsxs)(`div`,{className:`contact-options`,children:[(0,s.jsxs)(`div`,{className:`contact-option`,children:[(0,s.jsx)(`h3`,{children:`Live Chat`}),(0,s.jsx)(`p`,{children:`Chat with our support team in real-time for personalized assistance`}),(0,s.jsx)(`button`,{className:`btn-primary`,onClick:()=>{e(`/chat`)},children:`Start Chat`})]}),(0,s.jsxs)(`div`,{className:`contact-option`,children:[(0,s.jsx)(`h3`,{children:`Email Support`}),(0,s.jsx)(`p`,{children:`Send us an email and we'll respond within 24 hours`}),(0,s.jsx)(`a`,{href:`mailto:support@posteracrescamlaude.co.ke`,className:`btn-secondary`,children:`support@posteracrescamlaude.co.ke`})]}),(0,s.jsxs)(`div`,{className:`contact-option`,children:[(0,s.jsx)(`h3`,{children:`Phone Support`}),(0,s.jsx)(`p`,{children:`Call our support team directly`}),(0,s.jsx)(`a`,{href:`tel:+254712345678`,className:`btn-secondary`,children:`+254 712 345 678`})]})]}),(0,s.jsxs)(`div`,{className:`support-hours`,children:[(0,s.jsx)(`h3`,{children:`Support Hours`}),(0,s.jsxs)(`p`,{children:[(0,s.jsx)(`strong`,{children:`Monday - Friday:`}),` 8:00 AM - 8:00 PM EAT`]}),(0,s.jsxs)(`p`,{children:[(0,s.jsx)(`strong`,{children:`Saturday:`}),` 9:00 AM - 5:00 PM EAT`]}),(0,s.jsxs)(`p`,{children:[(0,s.jsx)(`strong`,{children:`Sunday:`}),` 10:00 AM - 4:00 PM EAT`]})]}),(0,s.jsxs)(`div`,{style:{marginTop:`2rem`,padding:`1.25rem`,background:`var(--bg-card)`,border:`1px solid var(--border-white)`,borderRadius:`8px`,textAlign:`center`},children:[(0,s.jsx)(`h4`,{style:{margin:`0 0 0.75rem 0`,color:`var(--text-bright)`,fontFamily:`'Poppins', sans-serif`},children:`Need Immediate Assistance?`}),(0,s.jsx)(`p`,{style:{margin:`0 0 1rem 0`,color:`var(--text-secondary)`,fontFamily:`'Inter', sans-serif`},children:`If you can't find what you're looking for in our help resources, our friendly support agents are standing by to assist you.`}),(0,s.jsx)(`button`,{className:`btn-primary`,onClick:()=>{e(`/chat`)},style:{padding:`0.75rem 1.5rem`,fontSize:`1rem`},children:`Chat with Support Now`})]})]})]})]}),(0,s.jsx)(()=>{if(!S)return null;let e=S.ticketId||S._id||`—`;return(0,s.jsx)(`div`,{style:{position:`fixed`,inset:0,zIndex:9999,background:`rgba(8,25,22,0.92)`,backdropFilter:`blur(8px)`,display:`flex`,alignItems:`center`,justifyContent:`center`,animation:`pcl-fade-in 0.3s ease`},children:(0,s.jsxs)(`div`,{style:{background:`linear-gradient(160deg, #0F2620, #0B1F1B)`,border:`1px solid rgba(43,182,163,0.3)`,borderRadius:16,padding:`3rem 2.5rem`,maxWidth:440,width:`90%`,textAlign:`center`,position:`relative`,overflow:`hidden`,boxShadow:`0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(43,182,163,0.08)`,animation:`pcl-slide-up 0.4s cubic-bezier(0.4,0,0.2,1)`},children:[(0,s.jsx)(`div`,{style:{position:`absolute`,top:0,left:0,right:0,height:2,background:`linear-gradient(90deg, transparent, #39FF88, #2BB6A3, #39FF88, transparent)`,opacity:.8}}),(0,s.jsx)(`div`,{style:{width:88,height:88,borderRadius:`50%`,margin:`0 auto 1.5rem`,background:`rgba(57,255,136,0.08)`,border:`3px solid #39FF88`,display:`flex`,alignItems:`center`,justifyContent:`center`,animation:`pcl-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s both`},children:(0,s.jsx)(`svg`,{width:`40`,height:`40`,viewBox:`0 0 40 40`,fill:`none`,children:(0,s.jsx)(`path`,{d:`M10 20L17 27L30 13`,stroke:`#39FF88`,strokeWidth:`3.5`,strokeLinecap:`round`,strokeLinejoin:`round`,style:{strokeDasharray:50,strokeDashoffset:50,animation:`pcl-draw 0.6s ease 0.4s forwards`}})})}),(0,s.jsx)(`h2`,{style:{margin:`0 0 0.5rem`,fontSize:22,fontWeight:700,color:`#39FF88`,fontFamily:`'Rajdhani',sans-serif`,letterSpacing:`0.06em`},children:`Ticket Submitted!`}),(0,s.jsx)(`p`,{style:{margin:`0 0 1.25rem`,fontSize:14,color:`#A9C4BE`,lineHeight:1.6},children:`Our support team will review your request and get back to you soon.`}),(0,s.jsxs)(`div`,{style:{background:`rgba(43,182,163,0.06)`,border:`1px solid rgba(43,182,163,0.2)`,borderRadius:10,padding:`1rem`,marginBottom:`1.5rem`},children:[(0,s.jsx)(`div`,{style:{fontSize:9,color:`#6A8A82`,letterSpacing:`0.15em`,textTransform:`uppercase`,fontFamily:`'Share Tech Mono',monospace`,marginBottom:4},children:`Your Reference Number`}),(0,s.jsx)(`div`,{style:{fontSize:20,fontWeight:800,color:`#EE6100`,fontFamily:`'Share Tech Mono',monospace`,letterSpacing:`0.08em`},children:e})]}),(0,s.jsx)(`p`,{style:{margin:`0 0 1.5rem`,fontSize:12,color:`#6A8A82`,fontFamily:`'Share Tech Mono',monospace`},children:`Save this number to track your ticket status`}),(0,s.jsxs)(`div`,{style:{display:`flex`,gap:10,justifyContent:`center`},children:[(0,s.jsx)(`button`,{onClick:()=>{C(null),r(`tickets`)},style:{padding:`0.65rem 1.5rem`,background:`transparent`,color:`#2BB6A3`,border:`1px solid rgba(43,182,163,0.3)`,borderRadius:6,cursor:`pointer`,fontWeight:600,fontSize:13,transition:`all 0.2s`,fontFamily:`'Poppins',sans-serif`},onMouseEnter:e=>{e.currentTarget.style.background=`rgba(43,182,163,0.08)`},onMouseLeave:e=>{e.currentTarget.style.background=`transparent`},children:`View My Tickets`}),(0,s.jsx)(`button`,{onClick:()=>C(null),style:{padding:`0.65rem 1.5rem`,background:`#EE6100`,color:`#fff`,border:`none`,borderRadius:6,cursor:`pointer`,fontWeight:700,fontSize:13,transition:`all 0.2s`,fontFamily:`'Poppins',sans-serif`},onMouseEnter:e=>{e.currentTarget.style.boxShadow=`0 0 20px rgba(238,97,0,0.3)`},onMouseLeave:e=>{e.currentTarget.style.boxShadow=`none`},children:`Done`})]})]})})},{}),(0,s.jsx)(`style`,{children:`
        @keyframes pcl-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pcl-slide-up { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pcl-pop { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }
        @keyframes pcl-draw { to { stroke-dashoffset: 0; } }
        .help-content {
          display: flex;
          flex-direction: column;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
        }

        .search-bar {
          margin-bottom: 1.5rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(244,241,234,0.1);
          border-radius: 8px;
          font-size: 1rem;
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .faq-categories {
          margin-bottom: 1.5rem;
        }

        .category-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .category-btn {
          padding: 0.5rem 1rem;
          border: 1px solid rgba(244,241,234,0.1);
          background: var(--bg-card);
          color: var(--text-secondary);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: "'Inter', sans-serif";
        }

        .category-btn.active {
          background: var(--grad-btn-red);
          color: white;
          border-color: #EE61004d;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .faq-item {
          border: 1px solid rgba(244,241,234,0.1);
          border-radius: 8px;
          padding: 1rem;
          background: var(--bg-card);
        }

        .faq-question h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text-bright);
        }

        .faq-answer p {
          margin: 0;
          color: var(--text-secondary);
        }

        .guides-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .guide-item {
          border: 1px solid rgba(244,241,234,0.1);
          border-radius: 8px;
          padding: 1rem;
          background: var(--bg-card);
        }

        .guide-item h3 {
          margin: 0 0 1rem 0;
          color: var(--text-bright);
        }

        .steps-list {
          padding-left: 1.5rem;
          margin: 0;
        }

        .steps-list li {
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
        }

        .articles-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .article-item {
          border: 1px solid rgba(244,241,234,0.1);
          border-radius: 8px;
          padding: 1rem;
          background: var(--bg-card);
        }

        .article-item h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text-bright);
        }

        .article-item p {
          margin: 0 0 0.5rem 0;
          color: var(--text-secondary);
        }

        .tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tag {
          background: #EE610026;
          color: var(--text-secondary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          border: 1px solid #EE61004d;
        }

        .tickets-content {
          display: flex;
          flex-direction: column;
        }

        .ticket-actions {
          margin-bottom: 1.5rem;
          text-align: right;
        }

        .btn-primary {
          padding: 0.65rem 1.5rem;
          background: var(--grad-btn-red);
          color: #fff;
          letter-spacing: .02em;
          box-shadow: var(--shadow-red);
          transition: var(--transition);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-family: "'Inter', sans-serif";
        }

        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px #EE610066;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ticket-form {
          background: var(--bg-card);
          border: 1px solid rgba(244,241,234,0.1);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .ticket-form h3 {
          margin-top: 0;
          color: var(--text-bright);
          margin-bottom: 1rem;
          font-family: "'Poppins', sans-serif";
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: var(--text-bright);
          font-family: "'Inter', sans-serif";
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.65rem 0.9rem;
          border: 1px solid rgba(244,241,234,0.12);
          border-radius: 8px;
          background: #08191699;
          color: var(--text-primary);
          font-size: 14px;
          font-family: "'Inter', sans-serif";
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          background: #0F2620cc;
          border-color: #EE610080;
          box-shadow: 0 0 0 3px #EE61001a;
          outline: none;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .tickets-list h3 {
          color: var(--text-bright);
          margin-bottom: 1rem;
          font-family: "'Poppins', sans-serif";
        }

        .no-tickets {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
        }

        .ticket-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .ticket-item {
          border: 1px solid rgba(244,241,234,0.1);
          border-radius: 8px;
          padding: 1rem;
          background: var(--bg-card);
        }

        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .ticket-header h4 {
          margin: 0;
          color: var(--text-primary);
          font-family: "'Inter', sans-serif";
        }

        .status-badge {
          letter-spacing: .04em;
          border: 1px solid;
          border-radius: 20px;
          padding: 3px 10px;
          font-family: "'Inter', sans-serif";
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.open {
          border-color: #2BB6A3;
          color: var(--text-blue);
          background: #2BB6A31a;
        }

        .status-badge.closed {
          border-color: #27ae60;
          color: #27ae60;
          background: #27ae601a;
        }

        .status-badge.pending {
          border-color: #f39c12;
          color: #f39c12;
          background: #f39c121a;
        }

        .contact-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .contact-option {
          border: 1px solid rgba(244,241,234,0.1);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
          background: var(--bg-card);
        }

        .contact-option h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text-bright);
          font-family: "'Poppins', sans-serif";
        }

        .contact-option p {
          margin: 0 0 1rem 0;
          color: var(--text-secondary);
        }

        .btn-secondary {
          display: inline-block;
          padding: 0.65rem 1.5rem;
          color: var(--white-soft);
          transition: var(--transition);
          background: transparent;
          border: 1px solid rgba(244,241,234,0.25);
          border-radius: 8px;
          text-decoration: none;
          cursor: pointer;
          font-weight: 600;
          font-family: "'Inter', sans-serif";
        }

        .btn-secondary:hover {
          color: #fff;
          background: rgba(244,241,234,0.08);
          border-color: rgba(244,241,234,0.5);
        }

        .support-hours {
          border: 1px solid rgba(244,241,234,0.1);
          border-radius: 8px;
          padding: 1.5rem;
          background: var(--bg-card);
        }

        .support-hours h3 {
          margin: 0 0 1rem 0;
          color: var(--text-bright);
          font-family: "'Poppins', sans-serif";
        }

        .support-hours p {
          margin: 0.5rem 0;
          color: var(--text-secondary);
        }
      `})]})};export{c as default};