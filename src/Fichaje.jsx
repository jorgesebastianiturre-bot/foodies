import { useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════
// FICHAJE FACIAL
// Cada empleado registra su cara una vez (Personal → Empleados → 📷).
// Después, desde el celular del local, toca "Fichar" y la app lo reconoce
// sola y le anota la hora de entrada o de salida. Al fichar la salida se
// crea automáticamente el registro de horas (el mismo que usa el recibo).
// El reconocimiento corre en el celular: la foto no sale a ningún servicio
// externo. Se guarda una foto chica de cada fichaje como prueba.
// ═══════════════════════════════════════════════════════════════════

const K = {
  bg:"#0d0d0d", card:"#161616", border:"#252525", accent:"#f97316", text:"#f0f0f0",
  muted:"#737373", success:"#22c55e", danger:"#ef4444", warn:"#eab308", input:"#1f1f1f",
};
const UMBRAL = 0.5;       // distancia máxima para aceptar que es la misma persona
const UMBRAL_SEGURO = 0.4; // por debajo de esto la coincidencia es muy clara
const gid = () => Math.random().toString(36).substr(2,9);
const hoyLocal = () => new Date().toLocaleDateString("en-CA");
const horaLocal = () => new Date().toTimeString().slice(0,5);
const turnoPorHora = (hhmm) => { const h = parseInt((hhmm||"0").split(":")[0],10); return h<12?"Mañana":h<17?"Tarde":"Noche"; };
const calcHoras = (e, s) => {
  if(!e||!s) return 0;
  const [eh,em]=e.split(":").map(Number), [sh,sm]=s.split(":").map(Number);
  let m=(sh*60+sm)-(eh*60+em); if(m<0) m+=24*60;
  return Math.round((m/60)*100)/100;
};
const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const fechaCorta = (f) => { if(!f) return ""; const d=new Date(f+"T12:00:00"); return `${DIAS[d.getDay()]} ${f.slice(8,10)}/${f.slice(5,7)}`; };

// ── Modelos: se cargan una sola vez y solo cuando se abre el fichaje ──
let faceapiPromesa = null;
const cargarFaceApi = () => {
  if(!faceapiPromesa){
    faceapiPromesa = (async ()=>{
      const faceapi = await import("@vladmandic/face-api/dist/face-api.esm.js");
      await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      return faceapi;
    })().catch(e=>{ faceapiPromesa=null; throw e; });
  }
  return faceapiPromesa;
};

const detectarCara = async (faceapi, video) => {
  const opciones = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const r = await faceapi.detectSingleFace(video, opciones).withFaceLandmarks().withFaceDescriptor();
  if(!r) return null;
  return { descriptor: Array.from(r.descriptor), score: r.detection.score, box: r.detection.box };
};

const distancia = (a, b) => { let s=0; for(let i=0;i<a.length;i++){ const d=a[i]-b[i]; s+=d*d; } return Math.sqrt(s); };

// Compara una cara contra todas las registradas y devuelve el empleado más parecido.
const buscarEmpleado = (descriptor, rostros) => {
  const mejorPorEmp = {};
  for(const r of rostros){
    const d = distancia(descriptor, r.descriptor);
    if(mejorPorEmp[r.empleado_id]===undefined || d<mejorPorEmp[r.empleado_id]) mejorPorEmp[r.empleado_id]=d;
  }
  const orden = Object.entries(mejorPorEmp).sort((a,b)=>a[1]-b[1]);
  if(!orden.length) return null;
  const [empId, dist] = orden[0];
  const segundo = orden[1]?.[1] ?? 9;
  // Si dos empleados quedan casi igual de parecidos no se decide: mejor pedir otra toma.
  if(dist > UMBRAL || segundo - dist < 0.05) return { empId:null, dist };
  return { empId, dist };
};

const fotoChica = (video, ancho=240) => {
  const c = document.createElement("canvas");
  const r = (video.videoHeight||480)/(video.videoWidth||640);
  c.width = ancho; c.height = Math.round(ancho*r);
  const ctx = c.getContext("2d");
  ctx.translate(c.width,0); ctx.scale(-1,1); // igual que se ve en pantalla (espejo)
  ctx.drawImage(video,0,0,c.width,c.height);
  return c.toDataURL("image/jpeg",0.6);
};

// ── Cámara frontal ──
const useCamara = (videoRef, activa) => {
  const [error, setError] = useState("");
  const [lista, setLista] = useState(false);
  useEffect(()=>{
    if(!activa) return;
    let stream = null, cancelado = false;
    (async ()=>{
      try {
        if(!navigator.mediaDevices?.getUserMedia) throw new Error("sin-camara");
        stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user", width:{ideal:640}, height:{ideal:480} }, audio:false });
        if(cancelado){ stream.getTracks().forEach(t=>t.stop()); return; }
        const v = videoRef.current; if(!v) return;
        v.srcObject = stream; v.setAttribute("playsinline",""); v.muted = true;
        await v.play().catch(()=>{});
        const esperar = () => new Promise(res=>{ if(v.readyState>=2&&v.videoWidth) res(); else v.onloadeddata=()=>res(); });
        await esperar();
        if(!cancelado) setLista(true);
      } catch(e) {
        setError(e?.name==="NotAllowedError" ? "No hay permiso para usar la cámara. Habilitalo en el navegador (ícono del candado junto a la dirección) y volvé a intentar." : "No se pudo abrir la cámara de este celular.");
      }
    })();
    return ()=>{ cancelado=true; if(stream) stream.getTracks().forEach(t=>t.stop()); setLista(false); };
  },[activa]);
  return { error, lista };
};

const Visor = ({ videoRef, mensaje, color }) => (
  <div style={{position:"relative",width:"100%",maxWidth:360,margin:"0 auto",aspectRatio:"3/4",background:"#000",borderRadius:16,overflow:"hidden",border:`3px solid ${color||K.border}`}}>
    <video ref={videoRef} playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>
    <div style={{position:"absolute",inset:"12% 18% 22% 18%",border:"2px dashed #ffffff66",borderRadius:"50%"}}/>
    {mensaje&&<div style={{position:"absolute",left:0,right:0,bottom:0,background:"#000c",color:"#fff",padding:"10px 12px",fontSize:14,fontWeight:700,textAlign:"center"}}>{mensaje}</div>}
  </div>
);

const Fondo = ({ children, onCerrar, titulo }) => (
  <div style={{position:"fixed",inset:0,background:"#000e",zIndex:4000,overflowY:"auto",fontFamily:"'Sora',Arial,sans-serif",color:K.text}}>
    <div style={{maxWidth:440,margin:"0 auto",padding:"16px 16px 40px"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
        <div style={{flex:1,fontSize:18,fontWeight:800}}>{titulo}</div>
        <button onClick={onCerrar} style={{background:"#2a2a2a",border:`1px solid ${K.border}`,color:K.text,borderRadius:10,padding:"10px 14px",fontSize:14,fontWeight:700,cursor:"pointer"}}>✕ Cerrar</button>
      </div>
      {children}
    </div>
  </div>
);

const btn = (fondo, extra={}) => ({background:fondo,color:"#fff",border:0,borderRadius:12,padding:"16px 18px",fontSize:17,fontWeight:800,cursor:"pointer",width:"100%",...extra});

// ═══════════════════════════════════════════════════════════════════
// FICHAR (lo usa cualquier empleado desde el celular del local)
// ═══════════════════════════════════════════════════════════════════
export function Fichar({ supabase, empleados:empProp, onCerrar, onHorasCreadas }) {
  const videoRef = useRef(null);
  const [empleados, setEmpleados] = useState(empProp||[]);
  const [etapa, setEtapa] = useState("cargando"); // cargando | buscando | encontrado | guardando | listo | error
  const [msg, setMsg] = useState("Preparando el reconocimiento…");
  const [rostros, setRostros] = useState([]);
  const [res, setRes] = useState(null);   // {empId, dist, foto, sugerido, ultimaEntrada}
  const [hecho, setHecho] = useState(null);
  const [intento, setIntento] = useState(0);
  const faceapiRef = useRef(null);
  const { error:errCam, lista } = useCamara(videoRef, etapa!=="listo"&&etapa!=="error");

  // 1) Cargar modelos y caras registradas
  useEffect(()=>{
    let ok = true;
    (async ()=>{
      try {
        const [fa, { data, error }, emps] = await Promise.all([
          cargarFaceApi(),
          supabase.from("rostros_empleados").select("empleado_id,descriptor"),
          (empProp&&empProp.length) ? Promise.resolve(null) : supabase.from("empleados").select("id,nombre,activo"), // desde la pantalla de ingreso todavía no están cargados
        ]);
        if(error) throw error;
        if(!ok) return;
        if(emps?.data) setEmpleados(emps.data);
        faceapiRef.current = fa;
        const lst = (data||[]).map(r=>({empleado_id:r.empleado_id, descriptor: Array.isArray(r.descriptor)?r.descriptor:JSON.parse(r.descriptor)}));
        setRostros(lst);
        if(!lst.length){ setEtapa("error"); setMsg("Todavía no hay caras registradas. El administrador tiene que registrar la cara de cada empleado en Personal → Empleados → 📷."); return; }
        setEtapa("buscando"); setMsg("Mirá a la cámara…");
      } catch(e) {
        console.error("fichaje:",e);
        if(ok){ setEtapa("error"); setMsg("No se pudo preparar el reconocimiento. Revisá la conexión a internet y volvé a intentar."); }
      }
    })();
    return ()=>{ ok=false; };
  },[]);

  // 2) Buscar una cara y reconocerla (hace falta que coincida en 2 tomas seguidas)
  useEffect(()=>{
    if(etapa!=="buscando"||!lista||!faceapiRef.current) return;
    let vivo = true, previo = null, sinCara = 0, desconocida = 0;
    const loop = async ()=>{
      while(vivo){
        const v = videoRef.current;
        try {
          const d = v ? await detectarCara(faceapiRef.current, v) : null;
          if(!vivo) return;
          if(!d){ sinCara++; previo=null; setMsg(sinCara>6?"No veo ninguna cara: acercate y poné la cara dentro del óvalo":"Mirá a la cámara…"); }
          else {
            sinCara = 0;
            const m = buscarEmpleado(d.descriptor, rostros);
            if(m?.empId){
              desconocida = 0;
              if(previo===m.empId){
                const foto = fotoChica(v);
                vivo = false;
                await encontrado(m.empId, m.dist, foto);
                return;
              }
              previo = m.empId; setMsg("Reconociendo…");
            } else {
              previo = null; desconocida++;
              setMsg(desconocida>4?"No te reconozco. Si sos nuevo, pedile al encargado que registre tu cara.":"Reconociendo…");
            }
          }
        } catch(e){ console.error(e); }
        await new Promise(r=>setTimeout(r,350));
      }
    };
    loop();
    return ()=>{ vivo=false; };
  },[etapa,lista,rostros,intento]);

  const encontrado = async (empId, dist, foto) => {
    // ¿Tiene una entrada abierta (sin salida) de las últimas 18 h? → le toca salida
    let ultimaEntrada = null;
    try {
      const { data } = await supabase.from("fichajes").select("*").eq("empleado_id",empId).order("created_at",{ascending:false}).limit(1);
      const u = data?.[0];
      if(u && u.tipo==="entrada" && (Date.now()-new Date(u.created_at).getTime()) < 18*3600*1000) ultimaEntrada = u;
    } catch(e){}
    setRes({ empId, dist, foto, sugerido: ultimaEntrada?"salida":"entrada", ultimaEntrada });
    setEtapa("encontrado");
  };

  const reintentar = () => { setRes(null); setEtapa("buscando"); setMsg("Mirá a la cámara…"); setIntento(i=>i+1); };

  const confirmar = async (tipo) => {
    if(!res) return;
    setEtapa("guardando");
    const fecha = hoyLocal(), hora = horaLocal();
    const fich = { id:gid(), empleado_id:res.empId, tipo, fecha, hora, distancia:Math.round(res.dist*1000)/1000, foto:res.foto, created_at:new Date().toISOString() };
    let horasReg = null, aviso = "";
    try {
      if(tipo==="salida"){
        const ent = res.ultimaEntrada;
        if(ent){
          const horas = calcHoras(ent.hora, hora);
          const hId = gid();
          const turno = turnoPorHora(ent.hora);
          const { error:eh } = await supabase.from("horas_trabajo").insert({id:hId,empleado_id:res.empId,fecha:ent.fecha,horas,hora_entrada:ent.hora,hora_salida:hora,turno,obs:"Fichaje facial"});
          if(eh) throw eh;
          fich.horas_trabajo_id = hId;
          horasReg = {id:hId,empleadoId:res.empId,fecha:ent.fecha,horas,horaEntrada:ent.hora,horaSalida:hora,turno,obs:"Fichaje facial"};
        } else aviso = "No había una entrada registrada: el encargado tiene que completar la hora de entrada.";
      }
      const { error } = await supabase.from("fichajes").insert(fich);
      if(error) throw error;
      if(horasReg) onHorasCreadas?.(horasReg);
      setHecho({ tipo, hora, horas: horasReg?.horas, aviso });
      setEtapa("listo");
      setTimeout(()=>onCerrar?.(), 8000);
    } catch(e) {
      console.error("fichaje guardar:",e);
      setEtapa("encontrado");
      alert("No se pudo guardar el fichaje. Revisá la conexión y tocá de nuevo.");
    }
  };

  const emp = res ? empleados.find(e=>e.id===res.empId) : null;
  const nombre = emp?.nombre || "Empleado";

  return (
    <Fondo titulo="🕐 Fichar entrada / salida" onCerrar={onCerrar}>
      {errCam&&<div style={{background:"#7f1d1d",borderRadius:12,padding:14,marginBottom:12,fontSize:14}}>{errCam}</div>}

      {(etapa==="cargando"||etapa==="buscando")&&<>
        <Visor videoRef={videoRef} mensaje={etapa==="cargando"?"Preparando… (la primera vez tarda unos segundos)":msg} color={K.accent}/>
        <div style={{color:K.muted,fontSize:12,textAlign:"center",marginTop:10}}>Poné la cara dentro del óvalo, con buena luz y sin gorra.</div>
      </>}

      {etapa==="error"&&<div style={{background:K.card,border:`1px solid ${K.border}`,borderRadius:14,padding:18,fontSize:15,lineHeight:1.5}}>{msg}</div>}

      {(etapa==="encontrado"||etapa==="guardando")&&res&&<div style={{textAlign:"center"}}>
        <img src={res.foto} alt="" style={{width:140,height:140,objectFit:"cover",borderRadius:"50%",border:`4px solid ${K.success}`,margin:"6px auto 10px",display:"block"}}/>
        <div style={{fontSize:24,fontWeight:800}}>Hola, {nombre} 👋</div>
        <div style={{color:K.muted,fontSize:13,margin:"4px 0 18px"}}>{fechaCorta(hoyLocal())} · {horaLocal()} hs{res.ultimaEntrada?` · entraste ${res.ultimaEntrada.fecha!==hoyLocal()?fechaCorta(res.ultimaEntrada.fecha)+" ":""}a las ${res.ultimaEntrada.hora}`:""}</div>
        <div style={{display:"grid",gap:10}}>
          <button disabled={etapa==="guardando"} style={btn(res.sugerido==="entrada"?K.success:"#2a2a2a",{border:res.sugerido==="entrada"?0:`1px solid ${K.border}`})} onClick={()=>confirmar("entrada")}>▶ Marcar ENTRADA</button>
          <button disabled={etapa==="guardando"} style={btn(res.sugerido==="salida"?K.danger:"#2a2a2a",{border:res.sugerido==="salida"?0:`1px solid ${K.border}`})} onClick={()=>confirmar("salida")}>■ Marcar SALIDA</button>
          <button disabled={etapa==="guardando"} style={{...btn("transparent",{fontSize:14,padding:"10px",color:K.muted,border:`1px solid ${K.border}`})}} onClick={reintentar}>No soy {nombre} · probar de nuevo</button>
        </div>
        {etapa==="guardando"&&<div style={{marginTop:12,color:K.muted}}>Guardando…</div>}
      </div>}

      {etapa==="listo"&&hecho&&<div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:64}}>{hecho.tipo==="entrada"?"✅":"👋"}</div>
        <div style={{fontSize:22,fontWeight:800,marginTop:8}}>{hecho.tipo==="entrada"?"Entrada registrada":"Salida registrada"}</div>
        <div style={{fontSize:18,marginTop:6}}>{nombre} · {hecho.hora} hs</div>
        {hecho.horas!=null&&<div style={{fontSize:16,color:K.success,marginTop:6}}>Trabajaste {hecho.horas} h</div>}
        {hecho.aviso&&<div style={{background:"#713f12",borderRadius:12,padding:12,marginTop:14,fontSize:14}}>{hecho.aviso}</div>}
        <button style={btn(K.accent,{marginTop:22})} onClick={onCerrar}>Listo</button>
      </div>}
    </Fondo>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REGISTRAR CARA (solo admin) — se toman 3 fotos de la cara
// ═══════════════════════════════════════════════════════════════════
export function RegistrarRostro({ supabase, empleado, empleados, onCerrar, onListo }) {
  const videoRef = useRef(null);
  const [etapa, setEtapa] = useState("cargando"); // cargando | listo | capturando | guardando | ok | error
  const [msg, setMsg] = useState("");
  const [tomas, setTomas] = useState([]);
  const [yaTiene, setYaTiene] = useState(0);
  const faceapiRef = useRef(null);
  const { error:errCam, lista } = useCamara(videoRef, etapa!=="ok");

  useEffect(()=>{
    let ok = true;
    (async ()=>{
      try {
        const [fa, { data }] = await Promise.all([cargarFaceApi(), supabase.from("rostros_empleados").select("id").eq("empleado_id",empleado.id)]);
        if(!ok) return;
        faceapiRef.current = fa; setYaTiene((data||[]).length); setEtapa("listo");
      } catch(e){ if(ok){ setEtapa("error"); setMsg("No se pudo preparar el reconocimiento. Revisá la conexión."); } }
    })();
    return ()=>{ ok=false; };
  },[]);

  const capturar = async () => {
    if(!lista||!faceapiRef.current) return;
    setEtapa("capturando"); setTomas([]);
    const nuevas = [];
    let intentos = 0;
    while(nuevas.length<3 && intentos<40){
      intentos++;
      setMsg(`Mirá a la cámara… foto ${nuevas.length+1} de 3`);
      const d = await detectarCara(faceapiRef.current, videoRef.current).catch(()=>null);
      if(d && d.score>0.5){
        nuevas.push({ descriptor:d.descriptor, foto:fotoChica(videoRef.current) });
        setTomas([...nuevas]);
        await new Promise(r=>setTimeout(r,700)); // pausa para que mueva un poco la cabeza
      } else await new Promise(r=>setTimeout(r,300));
    }
    if(nuevas.length<3){ setEtapa("listo"); setMsg("No se pudo ver bien la cara. Buscá más luz, acercate y probá de nuevo."); return; }
    // ¿Esta cara ya está registrada a nombre de otro empleado?
    try {
      const { data } = await supabase.from("rostros_empleados").select("empleado_id,descriptor").neq("empleado_id",empleado.id);
      const otros = (data||[]).map(r=>({empleado_id:r.empleado_id,descriptor:Array.isArray(r.descriptor)?r.descriptor:JSON.parse(r.descriptor)}));
      const m = buscarEmpleado(nuevas[0].descriptor, otros);
      if(m?.empId && m.dist<0.45){
        const otro = empleados.find(e=>e.id===m.empId)?.nombre || "otro empleado";
        if(!window.confirm(`Esta cara se parece mucho a la de ${otro}. ¿Seguro que es ${empleado.nombre}?`)){ setEtapa("listo"); setMsg(""); return; }
      }
    } catch(e){}
    setEtapa("guardando"); setMsg("Guardando…");
    try {
      await supabase.from("rostros_empleados").delete().eq("empleado_id",empleado.id);
      const filas = nuevas.map(t=>({ id:gid(), empleado_id:empleado.id, descriptor:t.descriptor, foto:t.foto }));
      const { error } = await supabase.from("rostros_empleados").insert(filas);
      if(error) throw error;
      setEtapa("ok"); onListo?.(empleado.id);
    } catch(e){ console.error(e); setEtapa("listo"); setMsg("No se pudo guardar. Revisá la conexión y probá de nuevo."); }
  };

  const borrar = async () => {
    if(!window.confirm(`¿Borrar la cara registrada de ${empleado.nombre}? No va a poder fichar hasta registrarla de nuevo.`)) return;
    await supabase.from("rostros_empleados").delete().eq("empleado_id",empleado.id);
    setYaTiene(0); onListo?.(empleado.id, true);
  };

  return (
    <Fondo titulo={`📷 Registrar cara · ${empleado.nombre}`} onCerrar={onCerrar}>
      {errCam&&<div style={{background:"#7f1d1d",borderRadius:12,padding:14,marginBottom:12,fontSize:14}}>{errCam}</div>}
      {etapa==="error"&&<div style={{background:K.card,borderRadius:12,padding:16}}>{msg}</div>}
      {etapa!=="ok"&&etapa!=="error"&&<>
        <div style={{fontSize:13,color:K.muted,marginBottom:10,lineHeight:1.5}}>
          Que {empleado.nombre} se ponga frente al celular, con buena luz y sin gorra. La app saca 3 fotos seguidas: que mueva apenas la cabeza entre una y otra.
          {yaTiene>0&&<div style={{color:K.warn,marginTop:6}}>Ya tiene una cara registrada. Si registrás de nuevo, se reemplaza.</div>}
        </div>
        <Visor videoRef={videoRef} mensaje={etapa==="cargando"?"Preparando…":msg} color={etapa==="capturando"?K.success:K.accent}/>
        <div style={{display:"flex",gap:8,justifyContent:"center",margin:"12px 0"}}>
          {[0,1,2].map(i=><div key={i} style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",background:K.input,border:`2px solid ${tomas[i]?K.success:K.border}`}}>{tomas[i]&&<img src={tomas[i].foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>)}
        </div>
        <button disabled={etapa!=="listo"||!lista} style={btn(etapa==="listo"&&lista?K.accent:"#444")} onClick={capturar}>{etapa==="capturando"?"Sacando fotos…":etapa==="guardando"?"Guardando…":"📷 Registrar cara"}</button>
        {yaTiene>0&&etapa==="listo"&&<button style={btn("transparent",{fontSize:14,padding:10,marginTop:10,color:K.danger,border:`1px solid ${K.danger}`})} onClick={borrar}>Borrar cara registrada</button>}
      </>}
      {etapa==="ok"&&<div style={{textAlign:"center",padding:"24px 0"}}>
        <div style={{fontSize:60}}>✅</div>
        <div style={{fontSize:20,fontWeight:800,marginTop:8}}>Cara de {empleado.nombre} registrada</div>
        <div style={{color:K.muted,marginTop:6,fontSize:14}}>Desde ahora puede fichar con el botón 🕐 Fichar.</div>
        <button style={btn(K.accent,{marginTop:20})} onClick={onCerrar}>Listo</button>
      </div>}
    </Fondo>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LISTADO DE FICHAJES (Personal → Fichajes)
// ═══════════════════════════════════════════════════════════════════
export function ListaFichajes({ supabase, empleados, esAdmin }) {
  const [lista, setLista] = useState(null);
  const [desde, setDesde] = useState(()=>{ const d=new Date(); d.setDate(d.getDate()-6); return d.toLocaleDateString("en-CA"); });
  const [hasta, setHasta] = useState(hoyLocal());
  const [emp, setEmp] = useState("");
  const [conCara, setConCara] = useState({});
  const [verFoto, setVerFoto] = useState(null);

  const cargar = async () => {
    let q = supabase.from("fichajes").select("*").gte("fecha",desde).lte("fecha",hasta).order("created_at",{ascending:false}).limit(500);
    if(emp) q = q.eq("empleado_id",emp);
    const { data } = await q;
    setLista(data||[]);
    const { data:r } = await supabase.from("rostros_empleados").select("empleado_id");
    const m = {}; (r||[]).forEach(x=>{ m[x.empleado_id]=(m[x.empleado_id]||0)+1; }); setConCara(m);
  };
  useEffect(()=>{ cargar(); },[desde,hasta,emp]);

  const inp = {padding:"8px 10px",borderRadius:8,border:`1px solid ${K.border}`,background:K.input,color:K.text,fontSize:13};
  const activos = empleados.filter(e=>e.activo!==false);
  const sinCara = activos.filter(e=>!conCara[e.id]);
  const abiertos = {}; // última marca por empleado → quién está adentro ahora
  (lista||[]).slice().reverse().forEach(f=>{ abiertos[f.empleado_id]=f; });
  const adentro = Object.values(abiertos).filter(f=>f.tipo==="entrada"&&(Date.now()-new Date(f.created_at).getTime())<18*3600*1000);

  return (
    <div>
      {adentro.length>0&&<div style={{background:"#14532d",border:`1px solid ${K.success}`,borderRadius:12,padding:12,marginBottom:12,fontSize:13}}>
        <b>🟢 Trabajando ahora:</b> {adentro.map(f=>`${empleados.find(e=>e.id===f.empleado_id)?.nombre||"?"} (desde ${f.hora})`).join(" · ")}
      </div>}
      {esAdmin&&sinCara.length>0&&<div style={{background:"#713f12",border:`1px solid ${K.warn}`,borderRadius:12,padding:12,marginBottom:12,fontSize:13}}>
        ⚠️ Sin cara registrada (no pueden fichar): <b>{sinCara.map(e=>e.nombre).join(", ")}</b>. Registrala en Empleados con el botón 📷.
      </div>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"flex-end"}}>
        <div><div style={{fontSize:11,color:K.muted,marginBottom:3}}>Personal</div><select style={inp} value={emp} onChange={e=>setEmp(e.target.value)}><option value="">— Todos —</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
        <div><div style={{fontSize:11,color:K.muted,marginBottom:3}}>Desde</div><input type="date" style={inp} value={desde} onChange={e=>setDesde(e.target.value)}/></div>
        <div><div style={{fontSize:11,color:K.muted,marginBottom:3}}>Hasta</div><input type="date" style={inp} value={hasta} onChange={e=>setHasta(e.target.value)}/></div>
        <button style={{...inp,cursor:"pointer",fontWeight:700}} onClick={cargar}>🔄</button>
      </div>
      {lista===null?<div style={{color:K.muted}}>Cargando…</div>:
       lista.length===0?<div style={{color:K.muted,textAlign:"center",padding:24}}>No hay fichajes en esas fechas.</div>:
       <div style={{display:"grid",gap:6}}>
        {lista.map(f=>{
          const n = empleados.find(e=>e.id===f.empleado_id)?.nombre||"?";
          const d = parseFloat(f.distancia);
          const conf = isNaN(d)?"":d<UMBRAL_SEGURO?"✔ seguro":"⚠ revisar foto";
          return <div key={f.id} style={{display:"flex",gap:10,alignItems:"center",background:K.card,border:`1px solid ${K.border}`,borderRadius:10,padding:8}}>
            {f.foto?<img src={f.foto} alt="" onClick={()=>setVerFoto(f)} style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",cursor:"pointer",flexShrink:0}}/>:<div style={{width:48,height:48,borderRadius:"50%",background:K.input}}/>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14}}>{n}</div>
              <div style={{fontSize:12,color:K.muted}}>{fechaCorta(f.fecha)} · {f.hora} hs</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:800,fontSize:13,color:f.tipo==="entrada"?K.success:K.danger}}>{f.tipo==="entrada"?"▶ ENTRADA":"■ SALIDA"}</div>
              {conf&&<div style={{fontSize:10,color:d<UMBRAL_SEGURO?K.muted:K.warn}}>{conf}</div>}
            </div>
          </div>;
        })}
       </div>}
      {verFoto&&<div onClick={()=>setVerFoto(null)} style={{position:"fixed",inset:0,background:"#000d",zIndex:4000,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10}}>
        <img src={verFoto.foto} alt="" style={{width:"min(80vw,320px)",borderRadius:16}}/>
        <div style={{color:"#fff",fontWeight:700}}>{empleados.find(e=>e.id===verFoto.empleado_id)?.nombre} · {verFoto.tipo} · {fechaCorta(verFoto.fecha)} {verFoto.hora}</div>
      </div>}
    </div>
  );
}
