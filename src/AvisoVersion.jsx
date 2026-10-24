import { useEffect, useState } from "react";

// Avisa cuando se publicó una versión nueva de la app.
// Salir y volver a entrar con el usuario NO recarga el código: hace falta recargar la página.
// Cada 2 minutos (y al volver a la app) compara el archivo principal publicado con el que está corriendo.
const scriptActual = () => {
  const s = Array.from(document.querySelectorAll("script[src]")).map(x=>x.getAttribute("src")).find(src=>/\/assets\/index-.*\.js/.test(src||""));
  return s ? s.replace(/^.*\/assets\//,"") : null;
};

export default function AvisoVersion() {
  const [hayNueva, setHayNueva] = useState(false);
  useEffect(()=>{
    const actual = scriptActual();
    if(!actual) return; // en desarrollo no hay archivo compilado
    let cancelado = false;
    const revisar = async ()=>{
      try {
        const r = await fetch("/?v="+Date.now(), {cache:"no-store"});
        const html = await r.text();
        const m = html.match(/\/assets\/(index-[^"']+\.js)/);
        if(!cancelado && m && m[1]!==actual) setHayNueva(true);
      } catch(e) { /* sin conexión: se vuelve a intentar después */ }
    };
    const id = setInterval(revisar, 2*60*1000);
    const alVolver = ()=>{ if(document.visibilityState==="visible") revisar(); };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", revisar);
    revisar();
    return ()=>{ cancelado=true; clearInterval(id); document.removeEventListener("visibilitychange", alVolver); window.removeEventListener("focus", revisar); };
  },[]);
  if(!hayNueva) return null;
  return (
    <div style={{position:"fixed",top:10,left:"50%",transform:"translateX(-50%)",zIndex:5000,background:"#dc2626",color:"#fff",borderRadius:12,padding:"12px 16px",boxShadow:"0 8px 30px #000a",display:"flex",gap:12,alignItems:"center",fontFamily:"'Sora',Arial,sans-serif",fontSize:14,fontWeight:700,width:"min(94vw,460px)"}}>
      <span style={{flex:1}}>🔄 Hay una actualización de la app</span>
      <button onClick={()=>window.location.reload()} style={{background:"#fff",color:"#dc2626",border:0,borderRadius:8,padding:"10px 14px",fontWeight:800,fontSize:14,cursor:"pointer"}}>Actualizar</button>
    </div>
  );
}
