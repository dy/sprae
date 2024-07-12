(function (g, f) {
    if ("object" == typeof exports && "object" == typeof module) {
      module.exports = f();
    } else if ("function" == typeof define && define.amd) {
      define("sprae", [], f);
    } else if ("object" == typeof exports) {
      exports["sprae"] = f();
    } else {
      g["sprae"] = f();
    }
  }(this, () => {
var exports = {};
var module = { exports };(function (g, f) {
    if ("object" == typeof exports && "object" == typeof module) {
      module.exports = f();
    } else if ("function" == typeof define && define.amd) {
      define("sprae", [], f);
    } else if ("object" == typeof exports) {
      exports["sprae"] = f();
    } else {
      g["sprae"] = f();
    }
  }(this, () => {
var exports = {};
var module = { exports };
var I=Object.defineProperty;var Y=Object.getOwnPropertyDescriptor;var ee=Object.getOwnPropertyNames;var te=Object.prototype.hasOwnProperty;var B=(e,r)=>{for(var t in r)I(e,t,{get:r[t],enumerable:!0})},re=(e,r,t,o)=>{if(r&&typeof r=="object"||typeof r=="function")for(let s of ee(r))!te.call(e,s)&&s!==t&&I(e,s,{get:()=>r[s],enumerable:!(o=Y(r,s))||o.enumerable});return e};var oe=e=>re(I({},"__esModule",{value:!0}),e);var de={};B(de,{default:()=>me});module.exports=oe(de);var O,p,T,P,j;function H(e){O=e.signal,p=e.effect,j=e.computed,P=e.batch||(r=>r()),T=e.untracked||P}var x=Symbol("signals"),E=Symbol("length");function v(e,r){if(!e||e[x])return e;if(Array.isArray(e))return ne(e);if(e.constructor!==Object)return e;let t={...r?.[x]},o=O(Object.values(e).length),s=new Proxy(t,{get:(n,i)=>i===E?o:i===x?t:t[i]?.valueOf(),set:(n,i,c,a)=>(a=t[i],M(t,i,c),a??++o.value,1),deleteProperty:(n,i)=>(t[i]&&(V(t,i),o.value--),1),ownKeys(){return o.value,Reflect.ownKeys(t)}});for(let n in e){let i=Object.getOwnPropertyDescriptor(e,n);i?.get?(t[n]=j(i.get.bind(s)))._set=i.set?.bind(s):(t[n]=void 0,M(t,n,e[n]))}return s}var ie={push:1,pop:1,shift:1,unshift:1,splice:1};function ne(e){let r;if(e[x])return e;let t=O(e.length),o=Array(e.length).fill(),s=new Proxy(o,{get(n,i){if(typeof i=="symbol")return i===E?t:i===x?o:o[i];if(i==="length")return ie[r]?t.peek():t.value;if(r=i,o[i])return o[i].valueOf();if(i<o.length)return(o[i]=O(v(e[i]))).value},set(n,i,c){if(i==="length"){for(let a=c,y=o.length;a<y;a++)delete s[a];return t.value=o.length=c,!0}return M(o,i,c),i>=t.peek()&&(t.value=o.length=Number(i)+1),!0},deleteProperty:(n,i)=>(o[i]&&V(o,i),1)});return s}function M(e,r,t){let o=e[r];if(r[0]==="_")e[r]=t;else if(!o)e[r]=o=t?.peek?t:O(v(t));else if(t!==o.peek())if(o._set)o._set(t);else if(Array.isArray(t)&&Array.isArray(o.peek())){let s=o.peek();s[E]?T(()=>{P(()=>{let n=0,i=t.length;for(;n<i;n++)s[n]=t[n];s.length=i})}):o.value=t}else o.value=v(t)}function V(e,r){let t=e[r],o=t[Symbol.dispose];o&&delete t[Symbol.dispose],delete e[r],o?.()}var R=Symbol.dispose||(Symbol.dispose=Symbol("dispose")),f={},g=new WeakMap;function d(e,r){if(!e?.childNodes)return;if(g.has(e))return Object.assign(g.get(e),r);let t=v(r||{}),o=[];return s(e),g.has(e)||g.set(e,t),e[R]=()=>{for(;o.length;)o.pop()();g.delete(e)},t;function s(n,i=n.parentNode){if(!!n.childNodes){for(let c=0;c<n.attributes?.length;){let a=n.attributes[c];if(a.name[0]===":"){n.removeAttribute(a.name);let y=a.name.slice(1).split(":");for(let k of y){let u=f[k]||f.default,l=(u.parse||W)(a.value),h=u(n,l,t,k);h&&o.push(h)}if(g.has(n))return n[R]&&o.push(n[R]);if(n.parentNode!==i)return}else c++}for(let c of[...n.childNodes])s(c,n)}}}var X={},W=(e,r,t)=>{if(t=X[e=e.trim()])return t;try{t=Z(e)}catch(o){F(o,r,e)}return X[e]=t},F=(e,r,t="")=>{throw Object.assign(e,{message:`\u2234 ${e.message}

${r}${t?`="${t}"

`:""}`,expr:t})},Z;d.use=e=>{e.signal&&H(e),e.compile&&(Z=e.compile)};var N=e=>{if(!e.nodeType)return e;let r=e.content.cloneNode(!0),t=[...e.attributes],o=document.createTextNode(""),s=(r.append(o),[...r.childNodes]);return{childNodes:s,content:r,remove:()=>r.append(...s),replaceWith(n){n!==o&&(o.before(n),r.append(...s))},attributes:t,removeAttribute(n){t.splice(t.findIndex(i=>i.name===n),1)}}};var J={};B(J,{batch:()=>le,computed:()=>se,effect:()=>G,signal:()=>z,untracked:()=>ce});var w,$,z=(e,r,t=new Set)=>(r={get value(){return w?.deps.push(t.add(w)),e},set value(o){if(o!==e){e=o;for(let s of t)$?$.add(s):s()}},peek(){return e}},r.toJSON=r.then=r.toString=r.valueOf=()=>r.value,r),G=(e,r,t,o)=>(t=s=>{r?.call?.(),s=w,w=t;try{r=e()}finally{w=s}},o=t.deps=[],t(),s=>{for(r?.call?.();s=o.pop();)s.delete(t)}),se=(e,r=z(),t,o)=>(t={get value(){return o||(o=G(()=>r.value=e())),r.value},peek:r.peek},t.toJSON=t.then=t.toString=t.valueOf=()=>t.value,t),le=e=>{let r=$;r||($=new Set);try{e()}finally{if(!r){r=$,$=null;for(let t of r)t()}}},ce=(e,r,t)=>(r=w,w=null,t=e(),w=r,t);var Q=Symbol("if");f.if=(e,r,t)=>{let o=e.nextElementSibling,s=document.createTextNode(""),n,i,c;return e.replaceWith(s),i=e.content?N(e):e,g.set(i,null),o?.hasAttribute(":else")&&(o.removeAttribute(":else"),o.hasAttribute(":if")||(o.remove(),c=o.content?N(o):o,g.set(c,null))),p(()=>{let a=r(t)?i:e[Q]?null:c;o&&(o[Q]=a===i),n!=a&&(n?.remove(),(n=a)&&(s.before(n.content||n),g.get(n)===null&&g.delete(n),d(n,t)))})};f.each=(e,[r,t,o],s)=>{let n=document.createTextNode("");e.replaceWith(n);let i,c,a=0,y=j(()=>{c=null;let l=o(s);return typeof l=="number"&&(l=Array.from({length:l},(h,b)=>b+1)),l?.constructor===Object&&(c=Object.keys(l),l=Object.values(l)),l||[]}),k=()=>{T(()=>{var S,C;let l=0,h=y.value,b=h.length;if(i&&!i[E]){for(let A of i[x]||[])A[Symbol.dispose]();i=null,a=0}if(b<a)i.length=b;else{if(!i)i=h;else for(;l<a;l++)i[l]=h[l];for(;l<b;l++){i[l]=h[l];let A=l,K=v({[r]:i[x]?.[A]||i[A],[t]:c?c[A]:A},s),_=e.content?N(e):e.cloneNode(!0);n.before(_.content||_),d(_,K),((C=i[S=x]||(i[S]=[]))[l]||(C[l]={}))[Symbol.dispose]=()=>{_[Symbol.dispose](),_.remove()}}}a=b})},u=0;return p(()=>{y.value[E]?.value,u?u++:(k(),queueMicrotask(()=>(u&&k(),u=0)))})};f.each.parse=e=>{let[r,t]=e.split(/\s+in\s+/),[o,s="$"]=r.split(/\s*,\s*/);return[o,s,W(t)]};f.ref=(e,r,t)=>{t[r]=e};f.ref.parse=e=>e;f.with=(e,r,t)=>{let o;return p(()=>{let s=r(t);d(e,o?s:o=v(s,t))})};f.html=(e,r,t)=>{let o=r(t);if(!o)return;let s=(o.content||o).cloneNode(!0);e.replaceChildren(s),d(e,t)};f.text=(e,r,t)=>(e.content&&e.replaceWith(e=N(e).childNodes[0]),p(()=>{let o=r(t);e.textContent=o??""}));f.class=(e,r,t)=>{let o=new Set;return p(()=>{let s=r(t),n=new Set;s&&(typeof s=="string"?s.split(" ").map(i=>n.add(i)):Array.isArray(s)?s.map(i=>i&&n.add(i)):Object.entries(s).map(([i,c])=>c&&n.add(i)));for(let i of o)n.has(i)?n.delete(i):e.classList.remove(i);for(let i of o=n)e.classList.add(i)})};f.style=(e,r,t)=>{let o=e.getAttribute("style")||"";return o.endsWith(";")||(o+="; "),p(()=>{let s=r(t);if(typeof s=="string")e.setAttribute("style",o+s);else{e.setAttribute("style",o);for(let n in s)e.style.setProperty(n,e.style[n]=s[n])}})};f.default=(e,r,t,o)=>{if(!o.startsWith("on"))return p(()=>{let u=r(t);if(o)D(e,o,u);else for(let l in u)D(e,pe(l),u[l])});let s=o.split("..").map(u=>{let l={evt:"",target:e,test:()=>!0};return l.evt=(u.startsWith("on")?u.slice(2):u).replace(/\.(\w+)?-?([-\w]+)?/g,(h,b,S="")=>(l.test=ae[b]?.(l,...S.split("-"))||l.test,"")),l});if(s.length==1)return p(()=>k(r(t),s[0]));let n,i,c,a=0,y=u=>{c=k(l=>(c(),i=u?.(l),(a=++a%s.length)?y(i):n&&y(n)),s[a])};return p(()=>(n=r(t),!c&&y(n),()=>n=null));function k(u,{evt:l,target:h,test:b,defer:S,stop:C,prevent:A,immediate:K,..._}){S&&(u=S(u));let q=L=>{try{b(L)&&(C&&(K?L.stopImmediatePropagation():L.stopPropagation()),A&&L.preventDefault(),u?.(L))}catch(U){F(U,`:on${l}`,u)}};return h.addEventListener(l,q,_),()=>h.removeEventListener(l,q,_)}};var ae={prevent(e){e.prevent=!0},stop(e){e.stop=!0},immediate(e){e.immediate=!0},once(e){e.once=!0},passive(e){e.passive=!0},capture(e){e.capture=!0},window(e){e.target=window},document(e){e.target=document},throttle(e,r){e.defer=t=>fe(t,r?Number(r)||0:108)},debounce(e,r){e.defer=t=>ue(t,r?Number(r)||0:108)},outside:e=>r=>{let t=e.target;return!(t.contains(r.target)||r.target.isConnected===!1||t.offsetWidth<1&&t.offsetHeight<1)},self:e=>r=>r.target===e.target,ctrl:(e,...r)=>t=>m.ctrl(t)&&r.every(o=>m[o]?m[o](t):t.key===o),shift:(e,...r)=>t=>m.shift(t)&&r.every(o=>m[o]?m[o](t):t.key===o),alt:(e,...r)=>t=>m.alt(t)&&r.every(o=>m[o]?m[o](t):t.key===o),meta:(e,...r)=>t=>m.meta(t)&&r.every(o=>m[o]?m[o](t):t.key===o),arrow:()=>m.arrow,enter:()=>m.enter,esc:()=>m.esc,tab:()=>m.tab,space:()=>m.space,delete:()=>m.delete,digit:()=>m.digit,letter:()=>m.letter,char:()=>m.char},m={ctrl:e=>e.ctrlKey||e.key==="Control"||e.key==="Ctrl",shift:e=>e.shiftKey||e.key==="Shift",alt:e=>e.altKey||e.key==="Alt",meta:e=>e.metaKey||e.key==="Meta"||e.key==="Command",arrow:e=>e.key.startsWith("Arrow"),enter:e=>e.key==="Enter",esc:e=>e.key.startsWith("Esc"),tab:e=>e.key==="Tab",space:e=>e.key==="\xA0"||e.key==="Space"||e.key===" ",delete:e=>e.key==="Delete"||e.key==="Backspace",digit:e=>/^\d$/.test(e.key),letter:e=>/^\p{L}$/gu.test(e.key),char:e=>/^\S$/.test(e.key)},D=(e,r,t)=>{t==null||t===!1?e.removeAttribute(r):e.setAttribute(r,t===!0?"":typeof t=="number"||typeof t=="string"?t:"")},fe=(e,r)=>{let t,o,s=n=>{t=!0,setTimeout(()=>{if(t=!1,o)return o=!1,s(n),e(n)},r)};return n=>t?o=!0:(s(n),e(n))},ue=(e,r)=>{let t;return o=>{clearTimeout(t),t=setTimeout(()=>{t=null,e(o)},r)}},pe=e=>e.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,r=>"-"+r.toLowerCase());f.value=(e,[r,t],o)=>{let s=e.type==="text"||e.type===""?i=>e.setAttribute("value",e.value=i??""):e.tagName==="TEXTAREA"||e.type==="text"||e.type===""?(i,c,a)=>(c=e.selectionStart,a=e.selectionEnd,e.setAttribute("value",e.value=i??""),c&&e.setSelectionRange(c,a)):e.type==="checkbox"?i=>(e.checked=i,D(e,"checked",i)):e.type==="select-one"?i=>{for(let c in e.options)c.removeAttribute("selected");e.value=i,e.selectedOptions[0]?.setAttribute("selected","")}:i=>e.value=i,n=e.type==="checkbox"?i=>t(o,e.checked):i=>t(o,e.value);return e.addEventListener("input",n),e.addEventListener("change",n),p(()=>s(r(o)))};f.value.parse=e=>{let r=[W(e)];try{r.push(W(`${e}=arguments[1];`))}catch{}return r};f.fx=(e,r,t)=>p(()=>r(t));d.use(J);d.use({compile:e=>d.constructor(`with (arguments[0]) { return ${e} };`)});var me=d;
if (document?.currentScript?.hasAttribute('init')) sprae(document.documentElement)if (typeof module.exports == "object" && typeof exports == "object") {
  var __cp = (to, from, except, desc) => {
    if ((from && typeof from === "object") || typeof from === "function") {
      for (let key of Object.getOwnPropertyNames(from)) {
        if (!Object.prototype.hasOwnProperty.call(to, key) && key !== except)
        Object.defineProperty(to, key, {
          get: () => from[key],
          enumerable: !(desc = Object.getOwnPropertyDescriptor(from, key)) || desc.enumerable,
        });
      }
    }
    return to;
  };
  module.exports = __cp(module.exports, exports);
}
return module.exports;
}))if (typeof module.exports == "object" && typeof exports == "object") {
  var __cp = (to, from, except, desc) => {
    if ((from && typeof from === "object") || typeof from === "function") {
      for (let key of Object.getOwnPropertyNames(from)) {
        if (!Object.prototype.hasOwnProperty.call(to, key) && key !== except)
        Object.defineProperty(to, key, {
          get: () => from[key],
          enumerable: !(desc = Object.getOwnPropertyDescriptor(from, key)) || desc.enumerable,
        });
      }
    }
    return to;
  };
  module.exports = __cp(module.exports, exports);
}
return module.exports;
}))
