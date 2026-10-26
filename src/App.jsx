import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { LOGO_FOODIES } from "./logoFoodies.js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Supabase devuelve como máximo 1.000 filas por consulta.
// traerTodo pide de a 1.000 hasta traer la tabla completa (la versión del 3/9 lo hacía; se había perdido).
const traerTodo = async (tabla, orden, asc=false) => {
  const N = 1000; let todo = []; let page = 0;
  while(true){
    let q = supabase.from(tabla).select("*");
    if(orden) q = q.order(orden,{ascending:asc});
    q = q.order("id",{ascending:true}); // desempate fijo para que no se repitan ni salteen filas entre páginas
    const { data, error } = await q.range(page*N,(page+1)*N-1);
    if(error) return { data: page===0 ? null : todo, error };
    todo = todo.concat(data||[]);
    if(!data || data.length < N) break;
    page++;
  }
  return { data: todo, error: null };
};

const USUARIOS = {
  admin:    { pass:"kokis1990",   rol:"admin" },
  empleado: { pass:"LKFOODIES",  rol:"empleado" },
  compras:  { pass:"compras2026", rol:"compras" },
};

const DIAS_ALERTA = 30;
const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const fmtFecha = (fecha) => {
  if(!fecha) return "—";
  const d = new Date(fecha+"T12:00:00");
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}-${mm}-${yy} ${DIAS[d.getDay()]}`;
};
const gid = () => Math.random().toString(36).substr(2,9);
// Fecha local (Argentina). Antes usaba UTC y después de las 21 hs daba el día siguiente.
const hoy = () => new Date().toLocaleDateString("en-CA");
const turnoPorHora = () => new Date().getHours()<16?"Mañana":"Noche";
const TURNO_KEY = "foodies_turno_activo";
// Avisos de transferencias sin confirmar: cuentan desde esta fecha en adelante (pedido el 26/10/2026)
const TRANSF_ALERTA_DESDE = "2026-10-26";
// WhatsApp: arma el número internacional de Argentina (549 + área + número, sin 0 ni 15)
const telWhatsApp = (tel) => {
  let d = String(tel||"").replace(/\D/g,"");
  if(!d) return "";
  if(d.startsWith("549")) return d;
  if(d.startsWith("54")) d = d.slice(2);
  if(d.startsWith("0")) d = d.slice(1);
  if(d.length===12){ if(d.slice(3,5)==="15") d=d.slice(0,3)+d.slice(5); else if(d.slice(4,6)==="15") d=d.slice(0,4)+d.slice(6); else if(d.slice(2,4)==="15") d=d.slice(0,2)+d.slice(4); }
  if(d.length===7) d = "266"+d;            // número local sin característica: San Luis (266)
  if(d.length===9 && d.startsWith("15")) d = "266"+d.slice(2);
  return d.length>=10 ? "549"+d : "";
};
const abrirWhatsApp = (tel, texto) => {
  const n = telWhatsApp(tel);
  if(!n){ alert("El cliente no tiene un teléfono válido cargado."); return; }
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(texto||"")}`, "_blank");
};
const normTxt = (s) => String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const leerTurnoGuardado = () => { try { const t = localStorage.getItem(TURNO_KEY); return t ? JSON.parse(t) : null; } catch(e) { return null; } };
const fmt = (n) => `$${Number(n||0).toLocaleString("es-AR")}`;
const diasDesde = (fecha) => Math.floor((new Date()-new Date(fecha))/(1000*60*60*24));

const C = {
  bg:"#0d0d0d", card:"#161616", border:"#252525",
  accent:"#f97316", text:"#f0f0f0", muted:"#737373",
  success:"#22c55e", danger:"#ef4444", warn:"#eab308", info:"#60a5fa", input:"#1f1f1f",
};
const css = {
  app:{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Sora',sans-serif", fontSize:14 },
  header:{ background:"#111", borderBottom:`2px solid ${C.accent}`, padding:"14px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 },
  logo:{ fontSize:22, fontWeight:800, color:C.accent },
  nav:{ display:"flex", gap:4, padding:"10px 22px", background:C.card, borderBottom:`1px solid ${C.border}`, flexWrap:"wrap" },
  nb:(a)=>({ padding:"7px 15px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:a?C.accent:"transparent", color:a?"#fff":C.muted, position:"relative" }),
  main:{ padding:"18px 22px", maxWidth:1100, margin:"0 auto" },
  row:{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12, alignItems:"flex-end" },
  card:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18, marginBottom:14 },
  cardTitle:{ fontSize:14, fontWeight:700, color:C.accent, marginBottom:14 },
  input:{ padding:"8px 11px", borderRadius:7, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:13, outline:"none", flex:1, minWidth:130 },
  sel:{ padding:"8px 11px", borderRadius:7, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:13, outline:"none", flex:1, minWidth:130 },
  btn:(v="primary")=>({ padding:"8px 16px", borderRadius:7, border:"none", cursor:"pointer", fontWeight:700, fontSize:12,
    background:v==="primary"?C.accent:v==="danger"?C.danger:v==="warn"?"#ca8a04":v==="success"?"#15803d":v==="info"?"#1d4ed8":"#2a2a2a", color:"#fff", whiteSpace:"nowrap" }),
  table:{ width:"100%", borderCollapse:"collapse" },
  th:{ textAlign:"left", padding:"7px 10px", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", borderBottom:`1px solid ${C.border}` },
  td:{ padding:"9px 10px", fontSize:12, borderBottom:`1px solid #1a1a1a`, verticalAlign:"middle" },
  badge:(v)=>({ display:"inline-block", padding:"2px 9px", borderRadius:999, fontSize:10, fontWeight:700,
    background:v==="pagada"?"#14532d":v==="pendiente"?"#7c2d12":"#1e3a5f",
    color:v==="pagada"?C.success:v==="pendiente"?"#fb923c":C.info }),
  total:{ background:`linear-gradient(135deg,${C.accent}22,transparent)`, border:`1px solid ${C.accent}44`, borderRadius:10, padding:"12px 18px", textAlign:"right", marginTop:12 },
  grid:(cols)=>({ display:"grid", gridTemplateColumns:`repeat(auto-fit,minmax(${cols||130}px,1fr))`, gap:10, marginBottom:16 }),
  stat:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" },
  statV:(color)=>({ fontSize:20, fontWeight:800, color:color||C.accent }),
  statL:{ fontSize:10, color:C.muted, marginTop:2 },
  tag:(color)=>({ display:"inline-block", background:color+"22", color, border:`1px solid ${color}44`, borderRadius:5, padding:"1px 7px", fontSize:10, fontWeight:700, marginRight:3 }),
  lbl:{ fontSize:10, color:C.muted, marginBottom:3 },
  col:{ display:"flex", flexDirection:"column", gap:3, flex:1 },
  bar:()=>({ height:8, borderRadius:4, background:C.border, overflow:"hidden", marginTop:4 }),
  barFill:(pct,color)=>({ height:"100%", width:`${Math.min(pct,100)}%`, background:color||C.accent, borderRadius:4 }),
  modal:{ position:"fixed", inset:0, background:"#000a", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
  modalBox:{ background:"#1a1a1a", border:`1px solid ${C.border}`, borderRadius:16, padding:28, width:"min(94vw,640px)", maxHeight:"90vh", overflowY:"auto" },
};

const ROLES_EMPLEADO = ["Panadero","Oficial","Ayudante","Vendedor","Cadete","Cocinero","Limpieza","Administrador","Otro"];

const emptyNf = () => ({ fecha:hoy(), turno:"Noche", tipoVenta:"Salon", vendedor:"", cadete:"", clienteId:"", comanda:"", medioPago1:"Efectivo", importe1:"", medioPago2:"", importe2:"", items:[], notas:"" });
const emptyNc = () => ({ fecha:hoy(), proveedor:"", nroFactura:"", tipoFactura:"Mercadería para venta", formaPago:"Efectivo", obs:"", items:[] });
const montoTransfer = (f) => {
  const imp1 = f.medioPago1==="Transferencia" ? (parseFloat(f.importe1)||0) : 0;
  const imp2 = f.medioPago2==="Transferencia" ? (parseFloat(f.importe2)||0) : 0;
  if(f.medioPago1==="Transferencia" && !f.medioPago2 && imp1===0) return parseFloat(f.total)||0;
  return imp1 + imp2;
};
const tieneTransfer = (f) => montoTransfer(f)>0;

const VENDEDORES_DEF = ["Eugenia","Noelia","Jorge","Lucas","Victoria"];
const CADETES_DEF = ["Gaston","Jorge","Kevin","Retiro","Noe","Gabi"];
const MEDIOS_DEF = ["Efectivo","Transferencia","Cuenta Corriente"];
const TIPOS_VENTA_DEF = ["Salon","Envio","Mostrador"];
const TIPOS_FACTURA_COMPRA = ["Mercadería para venta","Insumos de producción","Gasto operativo"];
const FORMAS_PAGO_COMPRA = ["Efectivo","Transferencia","Cuenta corriente"];

const PRODUCTOS_INICIALES = [
  { id:"P001", nombre:"Sand Mila Comun", precio:11000, activo:true },{ id:"P002", nombre:"Sand Mila Especial", precio:12000, activo:true },{ id:"P003", nombre:"Sand Mila Foodies", precio:12000, activo:true },{ id:"P004", nombre:"SAND de Suprema comun", precio:11000, activo:true },{ id:"P005", nombre:"SAND de Suprema Especial", precio:12000, activo:true },{ id:"P006", nombre:"Lomito Comu", precio:12000, activo:true },{ id:"P007", nombre:"lomito especial", precio:13000, activo:true },{ id:"P008", nombre:"Lomito de Pollo comun", precio:12000, activo:true },{ id:"P009", nombre:"Lomito de Pollo Especial", precio:13000, activo:true },{ id:"P010", nombre:"Sand comun en Pan Arabe", precio:13000, activo:true },{ id:"P011", nombre:"Sand especial en Pan Arabe", precio:14000, activo:true },{ id:"P012", nombre:"SAND de Suprema comun pan arabe", precio:13000, activo:true },{ id:"P013", nombre:"SAND de Suprema Especial pan arabe", precio:14000, activo:true },{ id:"P014", nombre:"Lomito de Pollo comunpan arabe", precio:14000, activo:true },{ id:"P015", nombre:"Lomito de Pollo Especial pan arabe", precio:15000, activo:true },{ id:"P017", nombre:"Lomito Comu en pan arabe", precio:14000, activo:true },{ id:"P018", nombre:"lomito especial en pan arabe", precio:15000, activo:true },{ id:"P019", nombre:"Hamburguezas Comun", precio:12000, activo:true },{ id:"P020", nombre:"Hamburguezas Especial", precio:13000, activo:true },{ id:"P021", nombre:"Hamburguezas Americana", precio:13000, activo:true },{ id:"P022", nombre:"hamburguezas Foodies", precio:13000, activo:true },{ id:"P023", nombre:"Hamburguezas Comun CASERA", precio:12000, activo:true },{ id:"P024", nombre:"Hamburguezas Especial CASERA", precio:13000, activo:true },{ id:"P025", nombre:"Hamburguezas Americana CASERA", precio:13000, activo:true },{ id:"P026", nombre:"hamburguezas Foodies CASERA", precio:13000, activo:true },{ id:"P027", nombre:"Agregad de Carne Doble", precio:2500, activo:true },{ id:"P028", nombre:"Agregado de Cheddar y carne doble", precio:4500, activo:true },{ id:"P029", nombre:"Miga jamon y queso", precio:6000, activo:true },{ id:"P030", nombre:"Miga Especial de Pollo", precio:6500, activo:true },{ id:"P031", nombre:"MIga Ternera y Queso", precio:7000, activo:true },{ id:"P032", nombre:"MIga ternera y Verduras", precio:7500, activo:true },{ id:"P033", nombre:"MIga ternera /tomate/queso", precio:8000, activo:true },{ id:"P034", nombre:"Miga jamon y queso dc", precio:15000, activo:false },{ id:"P035", nombre:"Miga Especial de Pollo dc", precio:15000, activo:false },{ id:"P036", nombre:"MIga Ternera y Queso dc", precio:20000, activo:false },{ id:"P037", nombre:"MIga ternera y Verduras dc", precio:20000, activo:false },{ id:"P038", nombre:"MIga ternera /tomate/queso dc", precio:20000, activo:false },{ id:"P039", nombre:"Milanesa Clasica con Guarnicion", precio:12000, activo:true },{ id:"P040", nombre:"Milanesa Clasica con Guarnicion p/ Compartir", precio:22000, activo:true },{ id:"P041", nombre:"Milanesa a Caballo Con Guarnicion", precio:14000, activo:true },{ id:"P042", nombre:"Milanesa a Caballo Con Guarnicion P /compartir", precio:25000, activo:true },{ id:"P043", nombre:"suprema clasica p/1", precio:12000, activo:true },{ id:"P044", nombre:"suprema casica p/2", precio:22000, activo:true },{ id:"P045", nombre:"Napolitana P/1", precio:17000, activo:true },{ id:"P046", nombre:"Napolitana P/ compartir", precio:32000, activo:true },{ id:"P047", nombre:"suprema Napolitana americana p/1", precio:17000, activo:true },{ id:"P048", nombre:"suprema Napolitana americana p/ compartir", precio:30000, activo:true },{ id:"P049", nombre:"Suprema Napo P/1", precio:16000, activo:true },{ id:"P050", nombre:"Suprema Napo P/Compartir", precio:30000, activo:true },{ id:"P051", nombre:"Matambre a la Pizza con Guarnicion", precio:20000, activo:true },{ id:"P052", nombre:"Matambre 4 Queso  con Guarnicion", precio:20000, activo:true },{ id:"P053", nombre:"Matambre al Roquefort con Guarnicion", precio:20000, activo:true },{ id:"P054", nombre:"Matambre al Verdeo", precio:20000, activo:true },{ id:"P055", nombre:"Mexicano P/1 con Fritas", precio:17000, activo:true },{ id:"P056", nombre:"Mexicano P/ Compartir Con Papas Fritas", precio:30000, activo:true },{ id:"P057", nombre:"Papas Rusticas", precio:5000, activo:true },{ id:"P058", nombre:"papas gratinadas", precio:5500, activo:true },{ id:"P059", nombre:"Papas Rustica chedar y baicon", precio:6000, activo:true },{ id:"P060", nombre:"Papas Foodies", precio:6500, activo:true },{ id:"P061", nombre:"Agreados", precio:2000, activo:true },{ id:"P062", nombre:"ENVIO", precio:1500, activo:true },{ id:"P063", nombre:"pizzas muzza", precio:16000, activo:true },{ id:"P064", nombre:"pizzas especial", precio:18000, activo:true },{ id:"P065", nombre:"pizza fugazeta", precio:18000, activo:true },{ id:"P066", nombre:"pizza calabresa", precio:18000, activo:true },{ id:"P067", nombre:"pizza napolitana", precio:18000, activo:true },{ id:"P068", nombre:"pizza rucula/ jamon crudo", precio:18000, activo:true },{ id:"P069", nombre:"pizza de ternera", precio:18000, activo:true },{ id:"P070", nombre:"pizza de 4 quesos", precio:18000, activo:true },{ id:"P071", nombre:"pizza de roquefort", precio:18000, activo:true },{ id:"P072", nombre:"pizzas de anchoas", precio:18000, activo:true },{ id:"P074", nombre:"pizzas muzza MT", precio:14000, activo:true },{ id:"P075", nombre:"pizzas especial MT", precio:16000, activo:true },{ id:"P076", nombre:"pizza fugazeta MT", precio:16000, activo:true },{ id:"P077", nombre:"pizza calabresa MT", precio:16000, activo:true },{ id:"P078", nombre:"pizza napolitana MT", precio:16000, activo:true },{ id:"P079", nombre:"pizza rucula/ jamon crudo MT", precio:16000, activo:true },{ id:"P080", nombre:"pizza de ternera MT", precio:16000, activo:true },{ id:"P081", nombre:"pizza de 4 quesos MT", precio:16000, activo:true },{ id:"P082", nombre:"pizza de roquefort MT", precio:16000, activo:true },{ id:"P083", nombre:"pizzas de anchoas MT", precio:16000, activo:true },{ id:"P084", nombre:"media pizzas MT", precio:9000, activo:true },{ id:"P085", nombre:"pizzas media muzza", precio:10000, activo:true },{ id:"P086", nombre:"pizzas media especial", precio:10000, activo:true },{ id:"P087", nombre:"pizza media fugazeta", precio:10000, activo:true },{ id:"P088", nombre:"pizza media calabresa", precio:10000, activo:true },{ id:"P089", nombre:"pizza media napolitana", precio:10000, activo:true },{ id:"P090", nombre:"pizza  media rucula/ jamon crudo", precio:10000, activo:true },{ id:"P091", nombre:"pizza media de ternera", precio:10000, activo:true },{ id:"P092", nombre:"pizza media 4 quesos", precio:10000, activo:true },{ id:"P093", nombre:"pizza media roquefort", precio:10000, activo:true },{ id:"P094", nombre:"pizzas media  anchoas", precio:10000, activo:true },{ id:"P095", nombre:"pizzas media muzza MT", precio:9000, activo:true },{ id:"P096", nombre:"pizzas media especial MT", precio:9000, activo:true },{ id:"P097", nombre:"pizza media fugazeta MT", precio:9000, activo:true },{ id:"P098", nombre:"pizza media calabresa MT", precio:9000, activo:true },{ id:"P099", nombre:"pizza media napolitana MT", precio:9000, activo:true },{ id:"P100", nombre:"pizza media rucula/ jamon crudo MT", precio:9000, activo:true },{ id:"P101", nombre:"pizza media de ternera MT", precio:9000, activo:true },{ id:"P102", nombre:"pizza media de 4 quesos MT", precio:9000, activo:true },{ id:"P103", nombre:"pizza media de roquefort MT", precio:9000, activo:true },{ id:"P104", nombre:"pizzas media de anchoas MT", precio:9000, activo:true },{ id:"P107", nombre:"empandas de Pollo docena", precio:15000, activo:true },{ id:"P108", nombre:"empanadas  Jamon /queso docena", precio:15000, activo:true },{ id:"P109", nombre:"emapandas  4 Quesos docena", precio:15000, activo:true },{ id:"P110", nombre:"empanadas Salame /queso docena", precio:15000, activo:true },{ id:"P111", nombre:"empanadas   queso / cebolla docena", precio:15000, activo:true },{ id:"P112", nombre:"empanadas Calabaza y queso docena", precio:15000, activo:true },{ id:"P113", nombre:"empanadas Mediterraneas docena", precio:15000, activo:true },{ id:"P114", nombre:"empanadas Carne docena", precio:15000, activo:true },{ id:"P115", nombre:"empanadas Capresse docena", precio:15000, activo:true },{ id:"P116", nombre:"sfijas docena", precio:15000, activo:true },{ id:"P117", nombre:"empanadas humita docena", precio:15000, activo:true },{ id:"P118", nombre:"empandas de Pollo docena cruda", precio:12000, activo:true },{ id:"P119", nombre:"empanadas  Jamon /queso docena cruda", precio:12000, activo:true },{ id:"P120", nombre:"emapandas  4 Quesos docena cruda", precio:12000, activo:true },{ id:"P121", nombre:"empanadas Salame /queso docena cruda", precio:12000, activo:true },{ id:"P122", nombre:"empanadas   queso / cebolla docena cruda", precio:12000, activo:true },{ id:"P123", nombre:"empanadas Calabaza y queso docena cruda", precio:12000, activo:true },{ id:"P124", nombre:"empanadas Mediterraneas docena cruda", precio:12000, activo:true },{ id:"P125", nombre:"empanadas Carne docena cruda", precio:12000, activo:true },{ id:"P126", nombre:"empanadas Capresse docena cruda", precio:12000, activo:true },{ id:"P127", nombre:"sfijas docena cruda", precio:12000, activo:true },{ id:"P128", nombre:"empanadas humita docena cruda", precio:12000, activo:true },{ id:"P129", nombre:"empandas de Pollo unidad", precio:1500, activo:true },{ id:"P130", nombre:"empanadas  Jamon /queso  unidad", precio:1500, activo:true },{ id:"P131", nombre:"emapandas  4 Quesos  unidad", precio:1500, activo:true },{ id:"P132", nombre:"empanadas Salame /queso unidad", precio:1500, activo:true },{ id:"P133", nombre:"empanadas   queso / cebolla  unidad", precio:1500, activo:true },{ id:"P134", nombre:"empanadas Calabaza y queso unidad", precio:1500, activo:true },{ id:"P135", nombre:"empanadas Mediterraneas unidad", precio:1500, activo:true },{ id:"P136", nombre:"empanadas Carne unidad", precio:1500, activo:true },{ id:"P137", nombre:"empanadas Capresse  unidad", precio:1500, activo:true },{ id:"P138", nombre:"sfijas unidad", precio:1500, activo:true },{ id:"P139", nombre:"empanadas humita unidad", precio:1500, activo:true },{ id:"P140", nombre:"Tartas de Jamon y queso crudas", precio:7000, activo:true },{ id:"P141", nombre:"Tartas de  Ternera crudas", precio:7000, activo:true },{ id:"P142", nombre:"Tartas de Pollo y verduras crudas", precio:7000, activo:true },{ id:"P143", nombre:"Tartas de ricota crudas", precio:7000, activo:true },{ id:"P144", nombre:"Tartas de espinaca y carne crudas", precio:7000, activo:true },{ id:"P145", nombre:"Tartas de calabaza crudas", precio:7000, activo:true },{ id:"P146", nombre:"Tartas de pollo y puerro crudas", precio:7000, activo:true },{ id:"P147", nombre:"tartas de verduras crudas", precio:7000, activo:true },{ id:"P148", nombre:"tartas de puerro crudas", precio:7000, activo:true },{ id:"P149", nombre:"tartas de humita crudas", precio:7000, activo:true },{ id:"P150", nombre:"tartas de capresse crudas", precio:7000, activo:true },{ id:"P152", nombre:"Tartas de Jamon y queso", precio:10000, activo:true },{ id:"P153", nombre:"Tartas de  Ternera", precio:10000, activo:true },{ id:"P154", nombre:"Tartas de Pollo y verduras", precio:10000, activo:true },{ id:"P155", nombre:"Tartas de ricota", precio:10000, activo:true },{ id:"P156", nombre:"Tartas de espinaca y carne", precio:10000, activo:true },{ id:"P157", nombre:"Tartas de calabaza", precio:10000, activo:true },{ id:"P158", nombre:"Tartas de pollo y puerro", precio:10000, activo:true },{ id:"P159", nombre:"tartas de verduras", precio:10000, activo:true },{ id:"P160", nombre:"tartas de puerro", precio:10000, activo:true },{ id:"P161", nombre:"tartas de humita", precio:10000, activo:true },{ id:"P162", nombre:"tartas de capresse", precio:10000, activo:true },{ id:"P163", nombre:"Bife de pollo al Plato con Ensalada", precio:14000, activo:true },{ id:"P164", nombre:"Bife de lomo al Plato con Ensalada", precio:15000, activo:true },{ id:"P165", nombre:"PORCION ENSALADA", precio:3500, activo:true },{ id:"P166", nombre:"Parrilla Completa P/1", precio:25000, activo:true },{ id:"P167", nombre:"Parrilla Completa P/", precio:45000, activo:true },{ id:"P168", nombre:"Tira de Asado p/1 con Guarnicion", precio:22000, activo:true },{ id:"P169", nombre:"Tira de Asado P/2 Mas Guarnicion", precio:38000, activo:true },{ id:"P170", nombre:"entrañas c/ guarnicion", precio:22000, activo:true },{ id:"P171", nombre:"Tartas de Masa Integral", precio:9500, activo:true },{ id:"P172", nombre:"Ensalada foodies", precio:12000, activo:true },{ id:"P173", nombre:"sandwch vegetariano", precio:7000, activo:true },{ id:"P174", nombre:"coca 1,5 comun", precio:5000, activo:true },{ id:"P175", nombre:"sprite 220 lata", precio:1800, activo:true },{ id:"P176", nombre:"fanta 220 lata", precio:1800, activo:true },{ id:"P177", nombre:"coca 220 lata", precio:1800, activo:true },{ id:"P178", nombre:"sprite 350 vidrio", precio:2000, activo:true },{ id:"P179", nombre:"fanta 350 vidrio", precio:2000, activo:true },{ id:"P180", nombre:"coca 350 vidrio", precio:2000, activo:true },{ id:"P181", nombre:"seven 354", precio:2000, activo:true },{ id:"P182", nombre:"coca 354 zero", precio:2000, activo:true },{ id:"P183", nombre:"Pepsi 354 lata", precio:2000, activo:true },{ id:"P184", nombre:"Sprite x 375ml", precio:2000, activo:true },{ id:"P185", nombre:"coca x 375", precio:2000, activo:true },{ id:"P186", nombre:"fanta x 375", precio:2000, activo:true },{ id:"P187", nombre:"COCA CHICA 600", precio:2500, activo:true },{ id:"P188", nombre:"COCA CHICA 600 zero", precio:2500, activo:true },{ id:"P189", nombre:"COCA CHICA 500", precio:2500, activo:true },{ id:"P190", nombre:"COCA CHICA 500 zero", precio:2500, activo:true },{ id:"P191", nombre:"fanta 2,25", precio:7000, activo:true },{ id:"P192", nombre:"sprite 2,25", precio:7000, activo:true },{ id:"P193", nombre:"pepsi 2l", precio:4500, activo:true },{ id:"P194", nombre:"mirinda 2l", precio:4500, activo:true },{ id:"P195", nombre:"SEVEN DE 2L", precio:4500, activo:true },{ id:"P196", nombre:"coca 3l", precio:9000, activo:true },{ id:"P197", nombre:"coca 2l descartable", precio:7000, activo:true },{ id:"P198", nombre:"COCA 1,5 DESCARTABLE zero", precio:5000, activo:true },{ id:"P199", nombre:"SPRITE 1L vidrio", precio:3500, activo:true },{ id:"P200", nombre:"Coca 1 lt Vidrio", precio:3500, activo:true },{ id:"P201", nombre:"fanta 1 lt vidrio", precio:3500, activo:true },{ id:"P202", nombre:"coca zero 1  lt vidrio", precio:3500, activo:true },{ id:"P203", nombre:"coca 1,5 comun vidrio", precio:4500, activo:true },{ id:"P204", nombre:"coca 1,5 zero  vidrio", precio:4500, activo:true },{ id:"P205", nombre:"Sprite 1,5 vidrio", precio:4500, activo:true },{ id:"P206", nombre:"fanta 1,5 vidrio", precio:4500, activo:true },{ id:"P207", nombre:"fanta 2ldescaerable", precio:7000, activo:true },{ id:"P209", nombre:"coca zero 2ldescartable", precio:7000, activo:true },{ id:"P210", nombre:"coca zero 2,25 descartable", precio:7000, activo:true },{ id:"P211", nombre:"sprite 2l descartable", precio:7000, activo:true },{ id:"P212", nombre:"sprite 1,500 descartable", precio:5000, activo:true },{ id:"P213", nombre:"pepsi x 1,500 descartable", precio:3500, activo:true },{ id:"P214", nombre:"Secco x 500", precio:1000, activo:true },{ id:"P215", nombre:"pepsi x  500", precio:1500, activo:true },{ id:"P216", nombre:"mirinda x 500", precio:4000, activo:true },{ id:"P217", nombre:"Secco   manzana  x 500", precio:1000, activo:true },{ id:"P218", nombre:"Secco   naranja  x 500", precio:1000, activo:true },{ id:"P219", nombre:"mirinda 2,25", precio:4000, activo:true },{ id:"P220", nombre:"COCA CHICA 600", precio:2500, activo:true },{ id:"P221", nombre:"COCA CHICA 600 zero", precio:2500, activo:true },{ id:"P222", nombre:"COCA CHICA 500", precio:2500, activo:true },{ id:"P223", nombre:"COCA CHICA 500 zero", precio:2500, activo:true },{ id:"P224", nombre:"fanta 2,25", precio:7000, activo:true },{ id:"P225", nombre:"sprite 2,25", precio:7000, activo:true },{ id:"P226", nombre:"soda 2l", precio:2000, activo:true },{ id:"P227", nombre:"agua Saborizada  MIX Fresh x 1,5", precio:2000, activo:true },{ id:"P228", nombre:"agua Saborizada  PERA  Fresh x 1,5", precio:2000, activo:true },{ id:"P229", nombre:"agua Saborizada  LIMON Fresh x 1,5", precio:2000, activo:true },{ id:"P230", nombre:"agua Saborizada  NARANJA  fresh x 1,5", precio:2000, activo:true },{ id:"P231", nombre:"agua Saborizada manzana fresh x 1,5", precio:2000, activo:true },{ id:"P232", nombre:"agua Saborizada pomelo fresh  x 1,5", precio:2000, activo:true },{ id:"P234", nombre:"SECCO 1,5 naranja", precio:2000, activo:true },{ id:"P235", nombre:"seCCO 1,5 manzana", precio:2000, activo:true },{ id:"P236", nombre:"salta rubia en lata", precio:3500, activo:true },{ id:"P237", nombre:"salta negra en lata", precio:4000, activo:true },{ id:"P238", nombre:"norte en lata", precio:3500, activo:true },{ id:"P239", nombre:"quilmes en lata", precio:3500, activo:true },{ id:"P240", nombre:"imperial en lata", precio:3500, activo:true },{ id:"P241", nombre:"budwaiser en lata", precio:3500, activo:true },{ id:"P242", nombre:"schwider en lata", precio:4000, activo:true },{ id:"P243", nombre:"heineken lata", precio:4000, activo:true },{ id:"P244", nombre:"cerbeza lata de golden", precio:4000, activo:true },{ id:"P245", nombre:"CORONA 700", precio:7000, activo:true },{ id:"P246", nombre:"mirer porron 330", precio:4000, activo:true },{ id:"P247", nombre:"imperial porron 330", precio:4000, activo:true },{ id:"P248", nombre:"cerveza norte 1l", precio:6000, activo:true },{ id:"P249", nombre:"cerveza stella 1l", precio:6000, activo:true },{ id:"P250", nombre:"cervezza salta 1l", precio:6000, activo:true },{ id:"P251", nombre:"cerveza quilmes  1l", precio:6000, activo:true },{ id:"P252", nombre:"cerveza 1899 1l", precio:7000, activo:true },{ id:"P253", nombre:"cerveza salta negra 1l", precio:7000, activo:true },{ id:"P254", nombre:"sand miga surtido", precio:15000, activo:true },{ id:"P255", nombre:"sandwchi ternera pan sanguchero", precio:6500, activo:true },{ id:"P256", nombre:"sandwch jamon y queso pan sanguchero", precio:4500, activo:true },{ id:"P257", nombre:"sandwch salame y queso pan sanguchero", precio:4500, activo:true },{ id:"P258", nombre:"sandwch jamon crudo  pan sanguchero", precio:6500, activo:true },{ id:"P259", nombre:"limonada 1l", precio:4500, activo:true },{ id:"P260", nombre:"PRITTY 1,5 L", precio:3500, activo:true },{ id:"P261", nombre:"PRITTY 1L", precio:2000, activo:true },{ id:"P262", nombre:"agua 500", precio:1500, activo:true },{ id:"P263", nombre:"monster mango", precio:3000, activo:true },{ id:"P264", nombre:"Menu de merluza rebosadas en hierbas", precio:11000, activo:true },{ id:"P265", nombre:"Menu pastel de papas", precio:11000, activo:true },{ id:"P266", nombre:"MENU GUISO DE LENTEJAS", precio:11000, activo:true },{ id:"P267", nombre:"Menu costeleta A CABALLO", precio:11000, activo:true },{ id:"P268", nombre:"Menu salpicon de res", precio:11000, activo:true },{ id:"P269", nombre:"MENU ZUQUINI RELLENO", precio:11000, activo:true },{ id:"P270", nombre:"MENU HUMITA", precio:11000, activo:true },{ id:"P271", nombre:"Menu canelones", precio:11000, activo:true },{ id:"P272", nombre:"Menu costelata  de cerdo con guarnicion", precio:11000, activo:true },{ id:"P273", nombre:"Menu kipe con guarnicion", precio:11000, activo:true },{ id:"P274", nombre:"Menu capeleti", precio:11000, activo:true },{ id:"P275", nombre:"Menu pollo entero c/guarnicion", precio:25000, activo:true },{ id:"P276", nombre:"MENU PAN DE CARNE", precio:11000, activo:true },{ id:"P277", nombre:"Menu arrollado con guarnicion", precio:11000, activo:true },{ id:"P278", nombre:"Menu suprema clasica con guarnicion", precio:11000, activo:true },{ id:"P279", nombre:"MENU PATAS CON GUARNICION", precio:11000, activo:true },{ id:"P280", nombre:"Menu albondigas con guarnicion", precio:11000, activo:true },{ id:"P281", nombre:"Menu costeleta con guarnicion", precio:11000, activo:true },{ id:"P282", nombre:"Menu saludable omelet", precio:11000, activo:true },{ id:"P283", nombre:"Menu  Pata muslo a la Portugueza", precio:11000, activo:true },{ id:"P284", nombre:"Menu Lampreados con guarnicion", precio:11000, activo:true },{ id:"P285", nombre:"Menu hamburguezas de Carne con guarnicion", precio:11000, activo:true },{ id:"P286", nombre:"Menu  Bombas de Queso", precio:11000, activo:true },{ id:"P287", nombre:"Menu tortilla de papa con guarnicion", precio:11000, activo:true },{ id:"P288", nombre:"Menu lampreado de pollo c/ guarnicion", precio:11000, activo:true },{ id:"P289", nombre:"Menu lasañana de verduras", precio:11000, activo:true },{ id:"P290", nombre:"Menu bombas de carne", precio:11000, activo:true },{ id:"P291", nombre:"Menu torre de panqqueque", precio:11000, activo:true },{ id:"P292", nombre:"Menu pollo a la portuguesa", precio:11000, activo:true },{ id:"P293", nombre:"MENU LAGSAÑA", precio:11000, activo:true },{ id:"P294", nombre:"Menu wraps CARNE", precio:11000, activo:true },{ id:"P295", nombre:"Menu wraps POLLO", precio:11000, activo:true },{ id:"P296", nombre:"Menu bife a la criolla con guarnicion", precio:11000, activo:true },{ id:"P297", nombre:"Menu wok de lomo", precio:11000, activo:true },{ id:"P298", nombre:"CUBIERTOS", precio:500, activo:true },{ id:"P299", nombre:"pollo entero c/ guarnicion", precio:25000, activo:true },
];

const CLIENTES_INICIALES = [
  {id:"C001",nombre:"Lucia",apellido:"",telefono:"",direccion:""},{id:"C002",nombre:"Dai Saya",apellido:"",telefono:"",direccion:""},{id:"C003",nombre:"Marcos",apellido:"",telefono:"",direccion:""},{id:"C004",nombre:"Zunino",apellido:"",telefono:"",direccion:""},{id:"C005",nombre:"Ribadeo",apellido:"",telefono:"",direccion:""},{id:"C006",nombre:"Lumeto",apellido:"",telefono:"",direccion:""},{id:"C007",nombre:"Maxi",apellido:"",telefono:"",direccion:""},{id:"C008",nombre:"Sofia",apellido:"",telefono:"",direccion:""},{id:"C009",nombre:"Ines",apellido:"",telefono:"",direccion:""},{id:"C010",nombre:"Lorena",apellido:"",telefono:"",direccion:""},{id:"C011",nombre:"Cristian Peterzon",apellido:"",telefono:"",direccion:""},{id:"C012",nombre:"Torres",apellido:"",telefono:"",direccion:""},{id:"C013",nombre:"Lucia Erazzu",apellido:"",telefono:"",direccion:""},
];

const PROVEEDORES_INICIALES = ["Carniceria Ali","Carniceria Campechana","Carniceria Doña Nena","Centro Envases","Corralon Cardozo","Estacion Servicio","Mauricio Garrafass","Mayorista Chino","Panaderia","Polleria Guadalupe","Rotonda Lacteos","Soria Garrafas","Verduleria Boliviano","francisco Verduras","Petersen Limpiezas","Panaderia Lk","federico tregar","Mercado Verduras","extra gas","frigorifico pampa","frescos y congelados srl","facundo pollo","distribuidora vidt","DESCARTABLES","COCA COLA DISTRIBUIDORA","hielo buby","GASTRONOMICA","luguenze distribuidora s.a","consumo diario","auto servicio capo","panela","la poblacion","shareout s.r.l","taldo dis","la virginia","ambulantes","manantial del valle","GASTRONOMICA"];

const ARTICULOS_COMPRAS = [
  {nombre:"Aceite lagrimas de girasol x 5l",categoria:"Mercaderia"},{nombre:"Aceite de Oliva",categoria:"Mercaderia"},{nombre:"Aceituna Negra",categoria:"Mercaderia"},{nombre:"Aceituna Verde",categoria:"Mercaderia"},{nombre:"Ajo",categoria:"Verduras"},{nombre:"Agua Mineral x 500",categoria:"Bebidas"},{nombre:"Alcohol",categoria:"Mercaderia"},{nombre:"Arroz Parboil",categoria:"Mercaderia"},{nombre:"Bandejas 105",categoria:"Packaging"},{nombre:"Bandejas de Carton n1 tartas",categoria:"Packaging"},{nombre:"Bandejas de Carton n2 sandwich",categoria:"Packaging"},{nombre:"Bandejas de Huevos",categoria:"Insumos"},{nombre:"Bolsa de Arranque",categoria:"Packaging"},{nombre:"Bolsa de Cebolla",categoria:"Verduras"},{nombre:"Bolsa de Hielo",categoria:"Hielo"},{nombre:"Bolsas de Consorcio",categoria:"Packaging"},{nombre:"Bolsas de Manijas",categoria:"Packaging"},{nombre:"Bolsas de Papa",categoria:"Verduras"},{nombre:"Cajon de Pollos",categoria:"Pollos"},{nombre:"Carne Molida",categoria:"Carnes"},{nombre:"Cloro",categoria:"Limpieza"},{nombre:"Desengrasante",categoria:"Limpieza"},{nombre:"Cajon de Tomates",categoria:"Verduras"},{nombre:"Cajon de Lechuga Crespa",categoria:"Verduras"},{nombre:"Sal Celusal x 25kg",categoria:"Mercaderia"},{nombre:"Salame Piamontesa x kg",categoria:"Fiambres"},{nombre:"Gas envasado",categoria:"Insumos"},{nombre:"Leche Tregar x 1l",categoria:"Mercaderia"},{nombre:"Queso Dambo",categoria:"Fiambres"},{nombre:"Jamon Cocido Piamontesa",categoria:"Fiambres"},{nombre:"Panceta Ahumada Chacra",categoria:"Fiambres"},{nombre:"Vinagre El Parrilero x 5l",categoria:"Mercaderia"},{nombre:"Mozzarella Cilindro Berni",categoria:"Fiambres"},{nombre:"Primo",categoria:"Carnes"},{nombre:"Lomo Rollizo",categoria:"Carnes"},{nombre:"Costilla Palomita",categoria:"Carnes"},{nombre:"Entraña",categoria:"Carnes"},{nombre:"Nalga",categoria:"Carnes"},{nombre:"Paty Super 40 x 125g",categoria:"Carnes"},{nombre:"Matambre",categoria:"Carnes"},{nombre:"Grasa",categoria:"Carnes"},{nombre:"Papel GRS Bob 40cm x kg",categoria:"Descartables"},{nombre:"Caja Pizza Micro Grande x100",categoria:"Descartables"},{nombre:"Caja Micro 12 Empanadas x100",categoria:"Descartables"},{nombre:"Consorcio PLB 60x90 50P x10",categoria:"Descartables"},{nombre:"Caja Media Pizza Micro x100",categoria:"Descartables"},{nombre:"Camiseta Color x40x50",categoria:"Descartables"},{nombre:"Crema Doble Tregar x350",categoria:"Mercaderia"},{nombre:"Piamonteza Fiambre de Cerdo",categoria:"Fiambres"},{nombre:"Piamonteza Jamon Cocido",categoria:"Fiambres"},{nombre:"Coca Zero 600x6",categoria:"Bebidas"},{nombre:"Coca Comun 1500x8 Vidrio",categoria:"Bebidas"},{nombre:"Sprite Fx 2,5 x6",categoria:"Bebidas"},{nombre:"Coca 600x12",categoria:"Bebidas"},{nombre:"Fanta Fx2,5 x6",categoria:"Bebidas"},{nombre:"Coca Comun 1500x6 Des",categoria:"Bebidas"},{nombre:"Fanta 1500x8 Vidrio",categoria:"Bebidas"},{nombre:"Coca Zero 2000x6 Descartable",categoria:"Bebidas"},{nombre:"Coca Lata 220x6",categoria:"Bebidas"},{nombre:"Coca Zero 1500x8 Vidrio",categoria:"Bebidas"},{nombre:"Sprite Lata x220x6",categoria:"Bebidas"},{nombre:"Coca 1 Litro x8 Vidrio",categoria:"Bebidas"},{nombre:"Sprite 1500x8 Vidrio",categoria:"Bebidas"},{nombre:"Pan de Molde",categoria:"Panaderia"},{nombre:"Mayonesa Hellmanns x 2,755kg",categoria:"Mercaderia"},{nombre:"Mostaza Savora x3k",categoria:"Mercaderia"},{nombre:"Ketchup Hellmans x3k",categoria:"Mercaderia"},{nombre:"Caldos Knorr x12 Verduras",categoria:"Mercaderia"},{nombre:"Salsa Aji Vanoli Picante",categoria:"Mercaderia"},{nombre:"Pimienta Blanca Molida",categoria:"Condimentos"},{nombre:"Alcohol Puro x5l",categoria:"Insumos"},{nombre:"Queso Azul La Quesera",categoria:"Fiambres"},{nombre:"Manteca Clucelat x200",categoria:"Mercaderia"},{nombre:"Atado Verdeo",categoria:"Verduras"},{nombre:"Atado Perejil",categoria:"Verduras"},{nombre:"Atado Puerro",categoria:"Verduras"},{nombre:"Cajon Tomate",categoria:"Verduras"},{nombre:"Bolsa Zanahoria",categoria:"Verduras"},{nombre:"Atado de Espinaca",categoria:"Verduras"},{nombre:"Cajon de Tomate Cherry",categoria:"Verduras"},{nombre:"Cajon Morron",categoria:"Verduras"},{nombre:"Bolsa Calabaza",categoria:"Verduras"},{nombre:"Ristra de Ajo",categoria:"Verduras"},{nombre:"Atado Rucula",categoria:"Verduras"},{nombre:"Atado Menta",categoria:"Verduras"},{nombre:"Cajon de Limon",categoria:"Verduras"},{nombre:"Bolsa Choclo",categoria:"Verduras"},{nombre:"Queso Cheddar La Tonadita",categoria:"Fiambres"},{nombre:"Tomillo x750",categoria:"Condimentos"},{nombre:"Seven Lata 354 x12",categoria:"Bebidas"},{nombre:"Mirinda Lata 354",categoria:"Bebidas"},{nombre:"Remolacha",categoria:"Verduras"},{nombre:"Arveja",categoria:"Verduras"},{nombre:"Detergente x5 litros",categoria:"Limpieza"},{nombre:"Hipoclorito x5 litros",categoria:"Limpieza"},{nombre:"Desodorante x5 litros",categoria:"Limpieza"},{nombre:"Cera x1 litro",categoria:"Limpieza"},{nombre:"Acido x5 litros",categoria:"Limpieza"},{nombre:"Soda Caustica x kilo",categoria:"Limpieza"},{nombre:"Mate Cocido Taragui x25u",categoria:"Mercaderia"},{nombre:"Pepsi 2l",categoria:"Bebidas"},{nombre:"Pepsi Lata 354ml",categoria:"Bebidas"},{nombre:"Cif Crema x750",categoria:"Limpieza"},{nombre:"Fresh Manzana x1,5",categoria:"Bebidas"},{nombre:"Quilmes x1l",categoria:"Bebidas"},{nombre:"Quilmes Lata 473cc",categoria:"Bebidas"},{nombre:"Norte Lata 473cc",categoria:"Bebidas"},{nombre:"Norte x1l",categoria:"Bebidas"},{nombre:"Mirinda 2l",categoria:"Bebidas"},{nombre:"Stella 1l",categoria:"Bebidas"},{nombre:"Servilleta Cartabella",categoria:"Mercaderia"},{nombre:"Peceto",categoria:"Carnes"},{nombre:"Costeleta Rolliza",categoria:"Carnes"},{nombre:"Salsa Golf 950gr",categoria:"Condimentos"},{nombre:"Yerba Amanda Suave",categoria:"Mercaderia"},{nombre:"Pure de Tomate La Huerta",categoria:"Mercaderia"},{nombre:"Levadura Cordobesa x500gr",categoria:"Mercaderia"},{nombre:"Agua Vitalisima 6x500cc",categoria:"Bebidas"},{nombre:"Soda Vitalisima 6x500cc",categoria:"Bebidas"},{nombre:"Paña Micro Fibra",categoria:"Limpieza"},{nombre:"Esponja Extra Plus de Cocina",categoria:"Limpieza"},{nombre:"Trapo de Piso Fibra",categoria:"Limpieza"},{nombre:"Seven 2l",categoria:"Bebidas"},{nombre:"Sprite 1l Cajon x8",categoria:"Bebidas"},{nombre:"Bolsa Camiseta Duo 50x70",categoria:"Descartables"},{nombre:"Atado de Apio",categoria:"Verduras"},{nombre:"Zapallo Brasilero",categoria:"Verduras"},{nombre:"Zapallito Verde",categoria:"Verduras"},{nombre:"Sprite 350x24",categoria:"Bebidas"},{nombre:"Fanta 350x24",categoria:"Bebidas"},{nombre:"Leche Ilolay",categoria:"Mercaderia"},{nombre:"Piamonteza Salame Tipo Milan",categoria:"Fiambres"},{nombre:"Queso Tybo Lactear",categoria:"Fiambres"},{nombre:"Lechuga Mantecosa",categoria:"Verduras"},{nombre:"Oregano",categoria:"Condimentos"},{nombre:"Pimenton",categoria:"Condimentos"},{nombre:"Delantales",categoria:"Insumos"},{nombre:"Merluza a las Finas Hierbas",categoria:"Pescado"},{nombre:"Tomate Triturado Doña Berti",categoria:"Mercaderia"},{nombre:"Servilleta de Cocina Sol",categoria:"Mercaderia"},{nombre:"Guantes Task",categoria:"Limpieza"},{nombre:"Virulana",categoria:"Limpieza"},{nombre:"Burgol x500",categoria:"Mercaderia"},{nombre:"Jabon Blanco x200",categoria:"Limpieza"},{nombre:"Sprite 1,5 x6",categoria:"Bebidas"},{nombre:"Fanta 1,5 x6",categoria:"Bebidas"},{nombre:"Soromillo",categoria:"Carnes"},{nombre:"Bondiola de Cerdo",categoria:"Carnes"},{nombre:"Rollo de Aluminio x1kg",categoria:"Descartables"},{nombre:"Pollo Recien Fainados",categoria:"Pollos"},{nombre:"Pepsi 1,5 x6",categoria:"Bebidas"},{nombre:"Film Inca 45cm x1000",categoria:"Descartables"},{nombre:"Consumo Diario",categoria:"Otros"},
];

// ══ COMPONENTE RECIBO IMPRIMIBLE ══
function Recibo({ emp, horas, movimientos, desde, hasta, onClose }) {
  const horasFilt = horas.filter(h=>h.empleadoId===emp.id&&(!desde||h.fecha>=desde)&&(!hasta||h.fecha<=hasta));
  const totalHoras = horasFilt.reduce((s,h)=>s+h.horas,0);
  const bruto = totalHoras*(parseFloat(emp.valorHora)||0);
  const movsFilt = movimientos.filter(m=>m.empleadoId===emp.id&&(!desde||m.fecha>=desde)&&(!hasta||m.fecha<=hasta));
  const consumos = movsFilt.filter(m=>m.tipo==="consumo");
  const adelantos = movsFilt.filter(m=>m.tipo==="adelanto");
  const totalConsumos = consumos.reduce((s,m)=>s+m.monto,0);
  const totalAdelantos = adelantos.reduce((s,m)=>s+m.monto,0);
  const neto = bruto-totalConsumos-totalAdelantos;
  const fmtR = (n)=>`$${Number(n||0).toLocaleString("es-AR")}`;

  const imprimir = () => {
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Recibo - ${emp.nombre}</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;max-width:620px;margin:0 auto;color:#111}
    h1{font-size:20px;margin-bottom:4px}h2{font-size:13px;color:#555;font-weight:normal;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th{text-align:left;padding:6px 8px;background:#f5f5f5;font-size:11px;text-transform:uppercase}
    td{padding:6px 8px;border-bottom:1px solid #eee;font-size:13px}
    .tr{font-weight:bold;background:#fff8f0}.neg{color:#ef4444}.neto{font-size:18px;font-weight:800;color:#f97316}
    @media print{button{display:none}}</style></head><body>
    <h1>🍔 Foodies — Liquidación de Haberes</h1>
    <h2>${emp.nombre} · ${emp.rol} · Período: ${desde||"inicio"} al ${hasta||hoy()}</h2>
    <table><thead><tr><th>Fecha</th><th>Horas</th><th>Valor/h</th><th>Subtotal</th></tr></thead>
    <tbody>${horasFilt.map(h=>`<tr><td>${h.fecha}</td><td>${h.horas}hs</td><td>${fmtR(emp.valorHora)}</td><td>${fmtR(h.horas*emp.valorHora)}</td></tr>`).join("")}
    <tr class="tr"><td colspan="2"><b>Total ${totalHoras.toFixed(1)} horas</b></td><td></td><td><b>${fmtR(bruto)}</b></td></tr></tbody></table>
    ${consumos.length?`<table><thead><tr><th>Consumos</th><th>Fecha</th><th>Monto</th></tr></thead><tbody>
    ${consumos.map(m=>`<tr><td>${m.descripcion||"—"}</td><td>${m.fecha}</td><td class="neg">- ${fmtR(m.monto)}</td></tr>`).join("")}
    <tr class="tr"><td colspan="2"><b>Total consumos</b></td><td class="neg"><b>- ${fmtR(totalConsumos)}</b></td></tr></tbody></table>`:""}
    ${adelantos.length?`<table><thead><tr><th>Adelantos</th><th>Fecha</th><th>Monto</th></tr></thead><tbody>
    ${adelantos.map(m=>`<tr><td>${m.descripcion||"—"}</td><td>${m.fecha}</td><td class="neg">- ${fmtR(m.monto)}</td></tr>`).join("")}
    <tr class="tr"><td colspan="2"><b>Total adelantos</b></td><td class="neg"><b>- ${fmtR(totalAdelantos)}</b></td></tr></tbody></table>`:""}
    <div style="border-top:2px solid #f97316;padding-top:14px;text-align:right;margin-top:8px">
    <span style="font-size:13px;color:#555">TOTAL NETO A PERCIBIR: </span><span class="neto">${fmtR(neto)}</span></div>
    <div style="margin-top:48px;display:flex;justify-content:space-between">
    <div style="text-align:center;border-top:1px solid #aaa;width:220px;padding-top:8px;font-size:11px">Firma Empleado</div>
    <div style="text-align:center;border-top:1px solid #aaa;width:220px;padding-top:8px;font-size:11px">Firma Empleador</div></div>
    <script>window.print();<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div style={css.modal} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={css.modalBox}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:C.accent}}>🧾 Recibo — {emp.nombre}</div>
          <button style={css.btn("neutral")} onClick={onClose}>✕</button>
        </div>
        <div style={{fontSize:11,color:C.muted,marginBottom:14}}>Período: {desde||"inicio"} al {hasta||hoy()} · {emp.rol}</div>
        {horasFilt.length>0&&<>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase"}}>Horas trabajadas</div>
          <table style={{...css.table,marginBottom:12}}>
            <thead><tr><th style={css.th}>Fecha</th><th style={css.th}>Horas</th><th style={css.th}>Valor/h</th><th style={css.th}>Subtotal</th></tr></thead>
            <tbody>
              {horasFilt.map(h=><tr key={h.id}><td style={css.td}>{h.fecha}</td><td style={css.td}>{h.horas}hs</td><td style={css.td}>{fmtR(emp.valorHora)}</td><td style={{...css.td,fontWeight:700}}>{fmtR(h.horas*emp.valorHora)}</td></tr>)}
              <tr style={{background:"#1a1a1a"}}><td style={{...css.td,fontWeight:700}} colSpan={2}>Total {totalHoras.toFixed(1)} horas</td><td style={css.td}></td><td style={{...css.td,fontWeight:800,color:C.accent,fontSize:14}}>{fmtR(bruto)}</td></tr>
            </tbody>
          </table>
        </>}
        {consumos.length>0&&<>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase"}}>Consumos</div>
          <table style={{...css.table,marginBottom:12}}>
            <thead><tr><th style={css.th}>Descripción</th><th style={css.th}>Fecha</th><th style={css.th}>Monto</th></tr></thead>
            <tbody>{consumos.map(m=><tr key={m.id}><td style={css.td}>{m.descripcion||"—"}</td><td style={css.td}>{m.fecha}</td><td style={{...css.td,color:C.danger,fontWeight:700}}>- {fmtR(m.monto)}</td></tr>)}</tbody>
          </table>
        </>}
        {adelantos.length>0&&<>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase"}}>Adelantos</div>
          <table style={{...css.table,marginBottom:12}}>
            <thead><tr><th style={css.th}>Descripción</th><th style={css.th}>Fecha</th><th style={css.th}>Monto</th></tr></thead>
            <tbody>{adelantos.map(m=><tr key={m.id}><td style={css.td}>{m.descripcion||"—"}</td><td style={css.td}>{m.fecha}</td><td style={{...css.td,color:C.danger,fontWeight:700}}>- {fmtR(m.monto)}</td></tr>)}</tbody>
          </table>
        </>}
        <div style={{background:`linear-gradient(135deg,${C.accent}22,transparent)`,border:`1px solid ${C.accent}44`,borderRadius:10,padding:"16px 18px",marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
            <div><div style={{fontSize:10,color:C.muted}}>Bruto horas</div><div style={{fontWeight:700}}>{fmtR(bruto)}</div></div>
            <div><div style={{fontSize:10,color:C.muted}}>Consumos</div><div style={{fontWeight:700,color:C.danger}}>- {fmtR(totalConsumos)}</div></div>
            <div><div style={{fontSize:10,color:C.muted}}>Adelantos</div><div style={{fontWeight:700,color:C.danger}}>- {fmtR(totalAdelantos)}</div></div>
            <div style={{background:C.accent+"22",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:C.muted}}>NETO A PERCIBIR</div><div style={{fontWeight:800,fontSize:18,color:C.accent}}>{fmtR(neto)}</div></div>
          </div>
        </div>
        <div style={{textAlign:"right"}}><button style={{...css.btn(),padding:"10px 24px"}} onClick={imprimir}>🖨️ Imprimir / PDF</button></div>
      </div>
    </div>
  );
}

// Pasa el foco a otro campo por id (para que Enter avance al siguiente casillero)
const irA = (id) => setTimeout(()=>{ const el=document.getElementById(id); if(el){ el.focus(); if(el.select&&el.type!=="date") try{el.select();}catch(e){} } }, 30);

// ── Selector escribible (combobox) ──
// Se escribe para filtrar, se baja/sube con las flechas, Enter elige y pasa al siguiente campo.
// En el celular se puede tocar la opción. `vacio` agrega una opción "nada" (valor "").
function SelRapido({ opciones, valor, onChange, placeholder, id, onEnter, vacio }) {
  const [texto, setTexto] = useState(null); // null = no está escribiendo: se muestra el valor elegido
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const ref = useRef(null); const listRef = useRef(null);
  const base = (opciones||[]).filter(o=>o!=null&&o!=="").map(String);
  const items = vacio ? [{v:"",l:vacio}, ...base.map(o=>({v:o,l:o}))] : base.map(o=>({v:o,l:o}));
  const q = normTxt(texto||"");
  const filtradas = q ? items.filter(it=>{ const n=normTxt(it.l); return q.split(" ").every(t=>n.split(" ").some(w=>w.startsWith(t))) || n.replace(/ /g,"").includes(q.replace(/ /g,"")); }) : items;
  const elegido = items.find(it=>it.v===valor);
  const cerrar = ()=>{ setOpen(false); setTexto(null); };
  const abrir = ()=>{ setOpen(true); const i=items.findIndex(it=>it.v===valor); setIdx(i>=0?i:0); };
  const elegir = (it, viaTeclado) => { onChange(it.v); setOpen(false); setTexto(null); if(viaTeclado&&onEnter) onEnter(it.v); };
  useEffect(()=>{
    if(!open) return;
    const fuera = e=>{ if(ref.current && !ref.current.contains(e.target)) cerrar(); };
    document.addEventListener("pointerdown", fuera);
    return ()=>document.removeEventListener("pointerdown", fuera);
  },[open]);
  useEffect(()=>{ const el=listRef.current?.children[idx]; if(el&&el.scrollIntoView) el.scrollIntoView({block:"nearest"}); },[idx,open]);
  const onKeyDown = (e)=>{
    if(e.key==="ArrowDown"){ e.preventDefault(); if(!open){ abrir(); return; } setIdx(i=>Math.min(i+1,Math.max(filtradas.length-1,0))); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); setIdx(i=>Math.max(i-1,0)); }
    else if(e.key==="Enter"){ e.preventDefault(); if(open&&filtradas[idx]) elegir(filtradas[idx],true); else if(!open&&onEnter) onEnter(valor); }
    else if(e.key==="Tab"){ if(open&&texto&&filtradas[idx]) elegir(filtradas[idx],false); else cerrar(); }
    else if(e.key==="Escape"){ cerrar(); }
  };
  return (
    <div ref={ref} style={{position:"relative"}}>
      <input id={id} className="fInput" autoComplete="off" enterKeyHint="next"
        style={{...css.input,width:"100%",boxSizing:"border-box",paddingRight:28,color:texto===null&&!elegido?C.muted:C.text}}
        placeholder={placeholder||"Escribí..."}
        value={texto!==null ? texto : (elegido?elegido.l:"")}
        onFocus={e=>{ abrir(); try{e.target.select();}catch(err){} }}
        onClick={()=>{ if(!open) abrir(); }}
        onChange={e=>{ setTexto(e.target.value); setOpen(true); setIdx(0); }}
        onKeyDown={onKeyDown}/>
      <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.muted,pointerEvents:"none"}}>{open?"▲":"▼"}</span>
      {open&&(
        <div ref={listRef} style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:8,zIndex:500,boxShadow:"0 8px 24px #000b",maxHeight:260,overflowY:"auto",overscrollBehavior:"contain"}}>
          {filtradas.map((it,i)=>(
            <div key={it.v||"__vacio"} className="fDropHover"
              style={{padding:"12px 14px",cursor:"pointer",fontSize:13,borderBottom:`1px solid ${C.border}`,fontWeight:it.v===valor?700:400,color:it.v===valor?C.accent:(it.v===""?C.muted:C.text),background:i===idx?"#2d2d2d":"transparent",borderLeft:i===idx?`3px solid ${C.accent}`:"3px solid transparent"}}
              onPointerDown={e=>e.preventDefault()}
              onClick={()=>elegir(it,false)}>
              {it.v===valor&&"✓ "}{it.l}
            </div>
          ))}
          {filtradas.length===0&&<div style={{padding:"12px 14px",color:C.muted,fontSize:12}}>Sin coincidencias</div>}
        </div>
      )}
    </div>
  );
}

export default function FoodiesApp() {
  // ── Login ──
  const [usuario, setUsuario] = useState(null);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState("nueva");
  const [cargando, setCargando] = useState(true);

  // ── Ventas ──
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [cadetes, setCadetes] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [tiposVenta, setTiposVenta] = useState([]);
  const [nf, setNf] = useState(emptyNf());
  // ── Turno (apertura con control de correlatividad) ──
  const [turnoActivo, setTurnoActivo] = useState(leerTurnoGuardado);
  const [taFecha, setTaFecha] = useState(hoy());
  const [taTurno, setTaTurno] = useState(turnoPorHora());
  const [taVendedor, setTaVendedor] = useState("");
  const [taComanda, setTaComanda] = useState("");
  const [modalAutorizacion, setModalAutorizacion] = useState(null);
  const [pinIngresado, setPinIngresado] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinVerificando, setPinVerificando] = useState(false);
  const [alertasCorr, setAlertasCorr] = useState([]);
  const [selOpen, setSelOpen] = useState(false);
  const [selIdx, setSelIdx] = useState(0);
  const selListRef = useRef(null);
  // Mantener visible el producto marcado con las flechas
  useEffect(()=>{ const el=selListRef.current?.querySelector(`[data-idx="${selIdx}"]`); if(el&&el.scrollIntoView) el.scrollIntoView({block:"nearest"}); },[selIdx,selOpen]);
  const selRef = useRef(null);
  // Cerrar la lista de productos al tocar fuera
  useEffect(()=>{
    if(!selOpen) return;
    const fuera = e=>{ if(selRef.current && !selRef.current.contains(e.target)) setSelOpen(false); };
    document.addEventListener("pointerdown", fuera);
    return ()=>document.removeEventListener("pointerdown", fuera);
  },[selOpen]);
  const [selProd, setSelProd] = useState(""); const [selQty, setSelQty] = useState(""); const [selPrecio, setSelPrecio] = useState(""); const [selBusq, setSelBusq] = useState("");
  // Buscador cliente en factura
  const [nfCliBusq, setNfCliBusq] = useState(""); const [nfCliOpen, setNfCliOpen] = useState(false);
  const [nfCliNew, setNfCliNew] = useState(false); const [nfCliNewTel, setNfCliNewTel] = useState(""); const [nfCliNewApe, setNfCliNewApe] = useState("");
  const [nfCliNewNom, setNfCliNewNom] = useState(""); const [nfCliNewDir, setNfCliNewDir] = useState("");
  const [nfReset, setNfReset] = useState(0); // key para resetear SelRapido al emitir
  const [nfCliIdx, setNfCliIdx] = useState(0);
  const [masOpen, setMasOpen] = useState(false);
  const [nfOk, setNfOk] = useState(""); // aviso "factura guardada"
  const [modalTransfAviso, setModalTransfAviso] = useState(false); // aviso al abrir turno: transferencias anteriores sin confirmar
  const guardandoNf = useRef(false); // menú "Más" de la barra inferior del celular
  // ── Impresión de factura ──
  const DATOS_LOCAL_DEF = {nombre:"FOODIES LK", direccion:"San Luis", telefono:"", instagram:"", cuit:""};
  const [datosLocal, setDatosLocal] = useState(DATOS_LOCAL_DEF);
  const [datosLocalGuardado, setDatosLocalGuardado] = useState(false);
  const [modalImprimir, setModalImprimir] = useState(null); // factura a imprimir
  const [impCli, setImpCli] = useState({nombre:"",direccion:"",telefono:"",dni:""});
  const nfCliRef = useRef(null);
  // Cerrar la lista de clientes al tocar fuera (antes se cerraba sola al tocar "Apellido")
  useEffect(()=>{
    if(!nfCliOpen) return;
    const fuera = e=>{ if(nfCliRef.current && !nfCliRef.current.contains(e.target)) setNfCliOpen(false); };
    document.addEventListener("pointerdown", fuera);
    return ()=>document.removeEventListener("pointerdown", fuera);
  },[nfCliOpen]);
  const [editando, setEditando] = useState(null);
  const [editSelProd, setEditSelProd] = useState(""); const [editSelQty, setEditSelQty] = useState(""); const [editSelPrecio, setEditSelPrecio] = useState("");
  // Historial filtros (CAMBIO 4)
  const [bFact, setBFact] = useState("");
  // Historial: por defecto muestra solo el turno abierto (o el día de hoy si no hay turno abierto)
  const [hfDesde, setHfDesde] = useState(()=>leerTurnoGuardado()?.fecha||hoy()); const [hfHasta, setHfHasta] = useState(()=>leerTurnoGuardado()?.fecha||hoy()); const [hfTurno, setHfTurno] = useState(()=>leerTurnoGuardado()?.turno||""); const [hfComanda, setHfComanda] = useState("");
  // Cierres
  const [cierres, setCierres] = useState([]);
  const [cierreFecha, setCierreFecha] = useState(hoy()); const [cierreTurno, setCierreTurno] = useState("Noche");
  const [cierreEfectivo, setCierreEfectivo] = useState(""); const [cierreObs, setCierreObs] = useState("");
  // Gastos y retiros cargados uno por uno durante el turno (restaurado de la versión del 3/9)
  const [gastosRetiros, setGastosRetiros] = useState([]);
  const [grTipo, setGrTipo] = useState("Gasto");
  const [grConcepto, setGrConcepto] = useState("");
  const [grMonto, setGrMonto] = useState("");
  const [grFiltDesde, setGrFiltDesde] = useState("");
  const [grFiltTurno, setGrFiltTurno] = useState("ultimo"); // por defecto: solo el último turno con gastos/retiros
  const [ccVerTodos, setCcVerTodos] = useState(false);     // por defecto: solo los últimos 5 cierres
  const [grFiltHasta, setGrFiltHasta] = useState("");
  // Filtros cierres (CAMBIO 1)
  const [ccFDesde, setCcFDesde] = useState(""); const [ccFHasta, setCcFHasta] = useState("");
  // Filtros transferencias (CAMBIO 2)
  const [trDesde, setTrDesde] = useState(""); const [trHasta, setTrHasta] = useState("");
  const [pagosCC, setPagosCC] = useState([]);
  const [ccCliente, setCcCliente] = useState(""); const [ccMonto, setCcMonto] = useState(""); const [ccObs, setCcObs] = useState("");
  // Consulta de cuenta corriente (abajo): búsqueda por cliente, estado y fechas de pagos
  const [ccBusq, setCcBusq] = useState(""); const [ccEstado, setCcEstado] = useState("todos");
  const [ccPDesde, setCcPDesde] = useState(""); const [ccPHasta, setCcPHasta] = useState("");
  const [ifDesde, setIfDesde] = useState(""); const [ifHasta, setIfHasta] = useState(""); const [ifVendedor, setIfVendedor] = useState(""); const [ifTurno, setIfTurno] = useState(""); const [ifTipo, setIfTipo] = useState("");
  const [pfNombre, setPfNombre] = useState(""); const [pfPrecio, setPfPrecio] = useState(""); const [pfEdit, setPfEdit] = useState(null); const [bProd, setBProd] = useState("");
  const [cfN, setCfN] = useState(""); const [cfA, setCfA] = useState(""); const [cfT, setCfT] = useState(""); const [cfDir, setCfDir] = useState(""); const [bCli, setBCli] = useState("");
  const [cfgInput, setCfgInput] = useState({ v:"", c:"", m:"", t:"" });

  // ── Compras ──
  const [compras, setCompras] = useState([]);
  const [pagosProveedores, setPagosProveedores] = useState([]);
  const [proveedores, setProveedores] = useState(PROVEEDORES_INICIALES);
  const [articulosCompra, setArticulosCompra] = useState(ARTICULOS_COMPRAS);
  const [nc, setNc] = useState(emptyNc());
  const [ncBusqArt, setNcBusqArt] = useState(""); const [ncSelArt, setNcSelArt] = useState(""); const [ncQty, setNcQty] = useState(""); const [ncPrecio, setNcPrecio] = useState("");
  const [ppProveedor, setPpProveedor] = useState(""); const [ppMonto, setPpMonto] = useState(""); const [ppForma, setPpForma] = useState("Efectivo"); const [ppObs, setPpObs] = useState(""); const [ppNroFact, setPpNroFact] = useState("");
  const [bCompras, setBCompras] = useState(""); const [comprasTab, setComprasTab] = useState("nueva");
  const [ncBusqProv, setNcBusqProv] = useState("");

  // ── Personal ──
  const [empleados, setEmpleados] = useState([]);
  const [horasTrabajo, setHorasTrabajo] = useState([]);
  const [movimientosPersonal, setMovimientosPersonal] = useState([]);
  const [personalTab, setPersonalTab] = useState("empleados");
  const [empForm, setEmpForm] = useState({nombre:"",dni:"",telefono:"",telefonoAlt:"",direccion:"",email:"",rol:"Ayudante",valorHora:"",fechaIngreso:"",notas:"",categoria:""});
  const [empEdit, setEmpEdit] = useState(null);
  const [horaEmpId, setHoraEmpId] = useState(""); const [horaFecha, setHoraFecha] = useState(hoy()); const [horaEntrada, setHoraEntrada] = useState(""); const [horaSalida, setHoraSalida] = useState(""); const [horaTurno, setHoraTurno] = useState("Noche"); const [horaObs, setHoraObs] = useState("");
  const [movEmpId, setMovEmpId] = useState(""); const [movTipo, setMovTipo] = useState("adelanto"); const [movMonto, setMovMonto] = useState(""); const [movDesc, setMovDesc] = useState(""); const [movFecha, setMovFecha] = useState(hoy());
  const [filtEmp, setFiltEmp] = useState(""); const [filtTipoMov, setFiltTipoMov] = useState(""); const [filtMovDesde, setFiltMovDesde] = useState(""); const [filtMovHasta, setFiltMovHasta] = useState("");
  const [reciboEmp, setReciboEmp] = useState(null); const [reciboDesde, setReciboDesde] = useState(""); const [reciboHasta, setReciboHasta] = useState(""); const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [semanaPersonal, setSemanaPersonal] = useState([]); // {id,empleadoId,semanaInicio,semanaFin,pagado,fechaPago,montoPagado,obs}
  const [estadosDia, setEstadosDia] = useState([]); // {id,empleadoId,fecha,estado,obs}
  const [semanaOffset, setSemanaOffset] = useState(0); // 0=esta semana, -1=anterior, etc
  const [filtEmpSemana, setFiltEmpSemana] = useState(""); // filtro por empleado en vista semanal
  const [horaEdId, setHoraEdId] = useState(null); const [horaEdHoras, setHoraEdHoras] = useState(""); const [horaEdObs, setHoraEdObs] = useState("");
  // Pérdidas y Mermas
  const [perdidas, setPerdidas] = useState([]);
  const [pTipo, setPTipo] = useState("Pérdida de insumos");
  const [pComanda, setPComanda] = useState("");
  const [pInsumo, setPInsumo] = useState("");
  const [pProducto, setPProducto] = useState("");
  const [pCantidad, setPCantidad] = useState("");
  const [pMonto, setPMonto] = useState("");
  const [pCosto, setPCosto] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pEstado, setPEstado] = useState("Pendiente");
  const [pSubTipo, setPSubTipo] = useState("reposicion"); // para reconocimiento: reposicion o devolucion
  const [pfDesde, setPfDesde] = useState(""); const [pfHasta, setPfHasta] = useState(""); const [pfTipo, setPfTipo] = useState(""); const [pfEstado, setPfEstado] = useState("");

  // ── Roles ──
  const esAdmin = usuario?.rol === "admin";
  const esCompras = usuario?.rol === "compras" || esAdmin;
  const esVentas = usuario?.rol === "empleado" || esAdmin;

  useEffect(() => { if(usuario) cargarDatos(); }, [usuario]);

  const cargarDatos = async () => {
    setCargando(true);

    // Ventas (tablas que ya existían)
    try {
      const [{ data:facts }, { data:items }] = await Promise.all([ traerTodo("facturas","created_at",false), traerTodo("factura_items") ]);
      const itemsPorFactura = {};
      (items||[]).forEach(i=>{ (itemsPorFactura[i.factura_id] ||= []).push(i); });
      if(facts && items) setFacturas(facts.map(f=>({
        ...f, id:f.id, numero:f.numero, comanda:f.comanda, fecha:f.fecha,
        turno:f.turno, tipoVenta:f.tipo_venta, vendedor:f.vendedor, cadete:f.cadete,
        cliente:f.cliente, clienteId:f.cliente_id,
        medioPago1:f.medio_pago1, importe1:f.importe1,
        medioPago2:f.medio_pago2, importe2:f.importe2,
        transferConfirmada:f.transfer_confirmada, total:f.total, notas:f.notas, estado:f.estado,
        items:(itemsPorFactura[f.id]||[]).map(i=>({id:i.id,prodId:i.prod_id,nombre:i.nombre,precio:i.precio,qty:i.qty}))
      })));
    } catch(e) { console.error("facturas:",e); }

    try {
      const { data:cierresDb } = await traerTodo("cierres_caja","created_at",false);
      if(cierresDb) setCierres(cierresDb.map(c=>({
        id:c.id, fecha:c.fecha, turno:c.turno, facturas:c.facturas_count,
        efectivo:parseFloat(c.efectivo)||0, transferConfirmada:parseFloat(c.transfer_confirmada)||0,
        transferPendiente:parseFloat(c.transfer_pendiente)||0, cuentaCorriente:parseFloat(c.cuenta_corriente)||0,
        efectivoContado:parseFloat(c.efectivo_contado)||0, gastosContado:parseFloat(c.gastos)||0, retiros:parseFloat(c.retiros)||0,
        efectivoEsperado:parseFloat(c.efectivo_esperado)||0, diferencia:parseFloat(c.diferencia)||0, obs:c.obs||"",
        comandaInicial:c.comanda_inicial||null
      })));
    } catch(e) { console.error("cierres:",e); }

    try {
      const { data:grDb } = await traerTodo("gastos_retiros","created_at",false);
      if(grDb) setGastosRetiros(grDb.map(g=>({
        id:g.id, fecha:g.fecha, hora:g.hora||"", turno:g.turno,
        tipo:g.tipo, concepto:g.concepto, monto:parseFloat(g.monto)||0, cierreId:g.cierre_id
      })));
    } catch(e) { console.error("gastos_retiros:",e); }

    // Datos del local para la factura impresa (fila "datos_local" en configuracion)
    try {
      const { data:dl } = await supabase.from("configuracion").select("valor").eq("id","datos_local").maybeSingle();
      if(dl&&dl.valor) setDatosLocal({...DATOS_LOCAL_DEF, ...JSON.parse(dl.valor)});
    } catch(e) { console.error("datos_local:",e); }

    // Alertas de correlatividad (turnos abiertos con código) — últimos 7 días, sin marcar como vistas
    try {
      const desde7 = new Date(Date.now()-7*24*60*60*1000).toISOString();
      const { data:al } = await supabase.from("alertas_comanda").select("*").eq("estado","autorizado").gte("created_at",desde7).order("created_at",{ascending:false});
      if(al) setAlertasCorr(al);
    } catch(e) { console.error("alertas_comanda:",e); }

    try {
      const { data:pagos } = await traerTodo("pagos_cc","created_at",false);
      if(pagos) setPagosCC(pagos.map(p=>({id:p.id,clienteId:p.cliente_id,clienteNombre:p.cliente_nombre,monto:p.monto,fecha:p.fecha,obs:p.obs})));
    } catch(e) { console.error("pagos_cc:",e); }

    try {
      const { data:config } = await traerTodo("configuracion");
      if(config) {
        // Fix old records with non-UUID ids: delete and reinsert with proper IDs
        const oldRecords = config.filter(r=>r.id&&r.id.length<=3);
        if(oldRecords.length>0) {
          for(const r of oldRecords) {
            await supabase.from("configuracion").delete().eq("id",r.id);
            await supabase.from("configuracion").insert({id:gid(),tipo:r.tipo,valor:r.valor,activo:true});
          }
          // Reload after fix
          const {data:configFixed} = await traerTodo("configuracion");
          if(configFixed) {
            const v2=configFixed.filter(r=>r.tipo==="vendedor").map(r=>r.valor);
            const ca2=configFixed.filter(r=>r.tipo==="cadete").map(r=>r.valor);
            const m2=configFixed.filter(r=>r.tipo==="medio_pago").map(r=>r.valor);
            const t2=configFixed.filter(r=>r.tipo==="tipo_venta").map(r=>r.valor);
            if(v2.length) setVendedores(v2); else setVendedores(VENDEDORES_DEF);
            if(ca2.length) setCadetes(ca2); else setCadetes(CADETES_DEF);
            if(m2.length) setMediosPago(m2); else setMediosPago(MEDIOS_DEF);
            if(t2.length) setTiposVenta(t2); else setTiposVenta(TIPOS_VENTA_DEF);
          }
        } else {
          const v=config.filter(r=>r.tipo==="vendedor").map(r=>r.valor);
          const ca=config.filter(r=>r.tipo==="cadete").map(r=>r.valor);
          const m=config.filter(r=>r.tipo==="medio_pago").map(r=>r.valor);
          const t=config.filter(r=>r.tipo==="tipo_venta").map(r=>r.valor);
          if(v.length) setVendedores(v); else setVendedores(VENDEDORES_DEF);
          if(ca.length) setCadetes(ca); else setCadetes(CADETES_DEF);
          if(m.length) setMediosPago(m); else setMediosPago(MEDIOS_DEF);
          if(t.length) setTiposVenta(t); else setTiposVenta(TIPOS_VENTA_DEF);
        }
      }
    } catch(e) { console.error("config:",e); }

    // Clientes — tabla nueva, manejo robusto
    try {
      const { data:clientesDb, error:errCli } = await traerTodo("clientes","nombre",true);
      if(errCli) throw errCli;
      if(clientesDb && clientesDb.length>0) {
        setClientes(clientesDb.map(c=>({id:c.id,nombre:c.nombre,apellido:c.apellido||"",telefono:c.telefono||"",direccion:c.direccion||""})));
      } else {
        // Tabla vacía: cargar iniciales y guardarlos
        await supabase.from("clientes").upsert(
          CLIENTES_INICIALES.map(c=>({id:c.id,nombre:c.nombre,apellido:c.apellido||"",telefono:c.telefono||"",direccion:c.direccion||""})),
          {onConflict:"id"}
        );
        setClientes(CLIENTES_INICIALES);
      }
    } catch(e) {
      console.error("clientes:",e);
      setClientes(CLIENTES_INICIALES); // fallback local si la tabla no existe
    }

    // Personal — tablas nuevas, manejo robusto
    try {
      const { data:empsDb } = await traerTodo("empleados","nombre",true);
      if(empsDb) setEmpleados(empsDb.map(e=>({id:e.id,nombre:e.nombre,dni:e.dni||"",telefono:e.telefono||"",telefonoAlt:e.telefono_alt||"",direccion:e.direccion||"",email:e.email||"",rol:e.rol||"Ayudante",valorHora:parseFloat(e.valor_hora)||0,fechaIngreso:e.fecha_ingreso||"",notas:e.notas||"",categoria:e.categoria||"",activo:e.activo!==false})));
    } catch(e) { console.error("empleados:",e); }

    try {
      const { data:horasDb } = await traerTodo("horas_trabajo","fecha",false);
      if(horasDb) setHorasTrabajo(horasDb.map(h=>({id:h.id,empleadoId:h.empleado_id,fecha:h.fecha,horas:parseFloat(h.horas),horaEntrada:h.hora_entrada||"",horaSalida:h.hora_salida||"",turno:h.turno||"",obs:h.obs||""})));
    } catch(e) { console.error("horas:",e); }

    try {
      const { data:movsDb } = await traerTodo("movimientos_personal","fecha",false);
      if(movsDb) setMovimientosPersonal(movsDb.map(m=>({id:m.id,empleadoId:m.empleado_id,tipo:m.tipo,monto:parseFloat(m.monto),fecha:m.fecha,descripcion:m.descripcion||""})));
    } catch(e) { console.error("movimientos:",e); }

    try {
      const { data:semanasDb } = await traerTodo("semanas_personal","semana_inicio",false);
      if(semanasDb) setSemanaPersonal(semanasDb.map(s=>({id:s.id,empleadoId:s.empleado_id,semanaInicio:s.semana_inicio,semanaFin:s.semana_fin,pagado:s.pagado||false,fechaPago:s.fecha_pago||"",montoPagado:parseFloat(s.monto_pagado)||0,obs:s.obs||""})));
    } catch(e) { console.error("semanas:",e); }

    try {
      const { data:estadosDb } = await traerTodo("estados_dia");
      if(estadosDb) setEstadosDia(estadosDb.map(e=>({id:e.id,empleadoId:e.empleado_id,fecha:e.fecha,estado:e.estado||"normal",obs:e.obs||""})));
    } catch(e) { console.error("estados_dia:",e); }

    // Productos desde Supabase
    try {
      const { data:prodDb } = await traerTodo("productos","nombre",true);
      if(prodDb && prodDb.length>0) {
        setProductos(prodDb.map(p=>({id:p.id,nombre:p.nombre,precio:parseFloat(p.precio)||0,activo:p.activo!==false})));
      } else {
        setProductos(PRODUCTOS_INICIALES);
        await supabase.from("productos").upsert(PRODUCTOS_INICIALES.map(p=>({id:p.id,nombre:p.nombre,precio:p.precio,activo:p.activo})),{onConflict:"id"});
      }
    } catch(e) { console.error("productos:",e); setProductos(PRODUCTOS_INICIALES); }

    // Proveedores desde Supabase
    try {
      const { data:provDb } = await traerTodo("proveedores","nombre",true);
      if(provDb && provDb.length>0) { setProveedores(provDb.map(p=>p.nombre)); }
      else { setProveedores(PROVEEDORES_INICIALES); await supabase.from("proveedores").upsert(PROVEEDORES_INICIALES.map((nombre,i)=>({id:"PROV"+i,nombre})),{onConflict:"id"}); }
    } catch(e) { console.error("proveedores:",e); }

    // Artículos de compras desde Supabase
    try {
      const { data:artDb } = await traerTodo("articulos_compras","nombre",true);
      if(artDb && artDb.length>0) { setArticulosCompra(artDb.map(a=>({id:a.id,nombre:a.nombre,categoria:a.categoria||"",ultimoPrecio:parseFloat(a.ultimo_precio)||0}))); }
      else { setArticulosCompra(ARTICULOS_COMPRAS); await supabase.from("articulos_compras").upsert(ARTICULOS_COMPRAS.map((a,i)=>({id:"ART"+i,nombre:a.nombre,categoria:a.categoria||"",ultimo_precio:0})),{onConflict:"id"}); }
    } catch(e) { console.error("articulos:",e); }

    // Pagos a proveedores desde Supabase
    try {
      const { data:pagProvDb } = await traerTodo("pagos_proveedores","created_at",false);
      if(pagProvDb) setPagosProveedores(pagProvDb.map(p=>({id:p.id,proveedor:p.proveedor,monto:parseFloat(p.monto)||0,forma:p.forma||"",obs:p.obs||"",nroFactura:p.nro_factura||"",fecha:p.fecha||""})));
    } catch(e) { console.error("pagos_proveedores:",e); }

    // Compras desde Supabase
    try {
      const { data:comprasDb } = await traerTodo("compras","created_at",false);
      const { data:compraItemsDb } = await traerTodo("compra_items");
      if(comprasDb) setCompras(comprasDb.map(comp=>({
        id:comp.id, numero:comp.numero, fecha:comp.fecha, proveedor:comp.proveedor,
        nroFactura:comp.nro_factura||"", tipoFactura:comp.tipo_factura||"",
        formaPago:comp.forma_pago||"", obs:comp.obs||"", total:parseFloat(comp.total)||0,
        pagado:parseFloat(comp.pagado)||0, estado:comp.estado||"pendiente",
        items:(compraItemsDb||[]).filter(i=>i.compra_id===comp.id).map(i=>({
          id:i.id,nombre:i.nombre,categoria:i.categoria||"",precio:parseFloat(i.precio)||0,qty:parseFloat(i.qty)||0
        }))
      })));
    } catch(e) { console.error("compras:",e); }

    try {
      const { data:perdidasDb } = await traerTodo("perdidas","fecha_hora",false);
      if(perdidasDb) setPerdidas(perdidasDb.map(p=>({id:p.id,fechaHora:p.fecha_hora,tipo:p.tipo,comanda:p.comanda||"",insumo:p.insumo||"",producto:p.producto||"",cantidad:parseFloat(p.cantidad)||0,monto:parseFloat(p.monto)||0,costoEstimado:parseFloat(p.costo_estimado)||0,descripcion:p.descripcion||"",usuario:p.usuario||"",estado:p.estado||"Pendiente"})));
    } catch(e) { console.error("perdidas:",e); }

    setCargando(false);
  };

  const handleLogin = () => {
    const u = USUARIOS[loginUser.toLowerCase().trim()];
    if(u && u.pass === loginPass.trim()) {
      setUsuario({nombre:loginUser,rol:u.rol});
      setLoginError("");
      setTab(u.rol==="compras"?"personal":"nueva");
    } else setLoginError("Usuario o contraseña incorrectos");
  };

  if(!usuario) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap')`}</style>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:40,width:"min(90vw,360px)",textAlign:"center"}}>
        <img src={LOGO_FOODIES} alt="Foodies LK" style={{width:140,height:140,borderRadius:20,display:"block",margin:"0 auto 10px"}}/>
        <div style={{fontSize:12,color:C.muted,marginBottom:28,letterSpacing:"2px",textTransform:"uppercase"}}>Sistema de Gestión</div>
        <div style={{textAlign:"left",marginBottom:12}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Usuario</div>
          <input style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.input,color:C.text,fontSize:14,outline:"none",boxSizing:"border-box"}}
            placeholder="admin / empleado / compras" value={loginUser} onChange={e=>setLoginUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        </div>
        <div style={{textAlign:"left",marginBottom:20}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Contraseña</div>
          <input style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.input,color:C.text,fontSize:14,outline:"none",boxSizing:"border-box"}}
            type="password" placeholder="••••••••" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        </div>
        {loginError&&<div style={{color:C.danger,fontSize:12,marginBottom:12}}>{loginError}</div>}
        <button style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:C.accent,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}} onClick={handleLogin}>Ingresar</button>
      </div>
    </div>
  );

  if(cargando) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.accent,fontSize:20,fontFamily:"sans-serif",fontWeight:700}}>🍔 Cargando Foodies...</div>;

  // ── VENTAS LOGIC ──
  const prodsActivos = productos.filter(p=>p.activo);
  // ── Buscador de productos: parcial, sin importar espacios, tildes ni mayúsculas ──
  // Los más vendidos aparecen primero cuando empatan.
  const ventasPorProd = (()=>{ const m={}; facturas.forEach(f=>(f.items||[]).forEach(i=>{ m[i.prodId]=(m[i.prodId]||0)+(i.qty||1); })); return m; })();
  const buscarProductos = (q) => {
    const qn = normTxt(q); if(!qn) return [];
    const toks = qn.split(" "); const qc = qn.replace(/ /g,"");
    const res = [];
    for(const p of prodsActivos){
      const n = normTxt(p.nombre); const nc = n.replace(/ /g,""); const words = n.split(" ");
      let score = 0;
      if(nc.startsWith(qc)) score = 100;                                         // "sandmi" → Sand Mila...
      else if(toks.every(t=>words.some(w=>w.startsWith(t)))) score = 80;        // "mila esp" → Sand Mila Especial
      else if(nc.includes(qc)) score = 60;                                       // "milaesp"
      else if(toks.every(t=>n.includes(t))) score = 50;                          // pedazos sueltos
      else if(qc.length>=3 && words.some(w=>w[0]===qc[0])) {                     // abreviaturas: "sme" → Sand Mila Especial
        let i=0; for(const ch of nc){ if(ch===qc[i]) i++; if(i===qc.length) break; }
        if(i===qc.length) score = 20;
      }
      if(score>0) res.push({p, score});
    }
    return res.sort((a,b)=>b.score-a.score || (ventasPorProd[b.p.id]||0)-(ventasPorProd[a.p.id]||0) || a.p.nombre.length-b.p.nombre.length).map(r=>r.p);
  };
  // viaTeclado: con Enter pasa a la cantidad; con toque (celular) baja el teclado para ver la factura
  const elegirProducto = (p, viaTeclado=false) => {
    setSelProd(p.id); setSelBusq(p.nombre); setSelPrecio(String(p.precio)); setSelOpen(false);
    if(viaTeclado) irA("nf-qty");
    else { try { document.activeElement?.blur(); } catch(e) {} }
  };

  // ── Cliente en la factura: buscar, elegir con teclado o dar de alta ──
  const opcionesCliente = () => {
    const q = normTxt(nfCliBusq); if(!q) return [];
    const toks = q.split(" ");
    const coinciden = clientes.filter(c=>{ const n=normTxt((c.nombre||"")+" "+(c.apellido||"")); return toks.every(t=>n.split(" ").some(w=>w.startsWith(t))) || n.replace(/ /g,"").includes(q.replace(/ /g,"")); }).slice(0,30);
    const exacto = coinciden.some(c=>normTxt((c.nombre||"")+" "+(c.apellido||""))===q);
    const ops = coinciden.map(c=>({c}));
    if(!exacto) ops.push({nuevo:true});
    return ops;
  };
  const elegirOpcionCliente = (o) => {
    if(o.nuevo){
      // Si escribió "nombre apellido", se separan solos
      const partes = nfCliBusq.trim().split(/\s+/);
      setNfCliNewNom(partes[0]||""); setNfCliNewApe(partes.slice(1).join(" ")); setNfCliNewTel(""); setNfCliNewDir("");
      setNfCliNew(true); setNfCliOpen(false); irA("nf-cli-nom"); return;
    }
    setNf(p=>({...p,clienteId:o.c.id}));
    setNfCliBusq(o.c.nombre+(o.c.apellido?" "+o.c.apellido:""));
    setNfCliOpen(false); setNfCliNew(false);
    irA("nf-comanda");
  };
  const guardarClienteNuevo = async () => {
    const nombre = (nfCliNewNom||nfCliBusq).trim(); if(!nombre){ irA("nf-cli-nom"); return; }
    const apellido = nfCliNewApe.trim(), telefono = nfCliNewTel.trim(), direccion = nfCliNewDir.trim();
    const id = gid();
    const { error } = await supabase.from("clientes").insert({id,nombre,apellido,telefono,direccion});
    if(error){ alert("No se pudo guardar el cliente: "+error.message); return; }
    setClientes(prev=>[...prev,{id,nombre,apellido,telefono,direccion}]);
    setNf(p=>({...p,clienteId:id}));
    setNfCliBusq(nombre+(apellido?" "+apellido:""));
    setNfCliOpen(false); setNfCliNew(false); setNfCliNewNom(""); setNfCliNewApe(""); setNfCliNewTel(""); setNfCliNewDir("");
    irA("nf-comanda");
  };


  // ── Tipo de venta: si es Envío, se agrega solo el ítem de envío al principio ──
  const prodEnvio = productos.find(p=>p.id==="P062") || productos.find(p=>normTxt(p.nombre)==="envio");
  const cambiarTipoVenta = (v) => setNf(p=>{
    const esEnvio = normTxt(v)==="envio";
    let items = p.items;
    if(prodEnvio){
      const tiene = items.some(i=>i.prodId===prodEnvio.id);
      if(esEnvio&&!tiene) items = [{id:gid(),prodId:prodEnvio.id,nombre:prodEnvio.nombre,precio:prodEnvio.precio,qty:1},...items];
      if(!esEnvio&&tiene) items = items.filter(i=>i.prodId!==prodEnvio.id);
    }
    return {...p, tipoVenta:v, cadete:esEnvio?p.cadete:"", items};
  });
  const totalItems = nf.items.reduce((s,i)=>s+i.precio*i.qty,0);
  const totalPagos = (parseFloat(nf.importe1)||0)+(parseFloat(nf.importe2)||0);
  const dif = totalItems - totalPagos;

  const addItem = () => {
    const p = productos.find(x=>x.id===selProd); if(!p) return;
    const precio = selPrecio!==""?parseFloat(selPrecio):p.precio;
    const qty = parseInt(selQty)||1;
    const ex = nf.items.find(i=>i.prodId===p.id&&i.precio===precio);
    if(ex) setNf(prev=>({...prev,items:prev.items.map(i=>i.prodId===p.id&&i.precio===precio?{...i,qty:i.qty+qty}:i)}));
    else setNf(prev=>({...prev,items:[...prev.items,{id:gid(),prodId:p.id,nombre:p.nombre,precio,qty}]}));
    setSelProd(""); setSelQty(""); setSelPrecio(""); setSelBusq("");
  };

  // ── TURNO: apertura, correlatividad y cierre ──
  const guardarTurno = (ta) => {
    setTurnoActivo(ta);
    try { if(ta) localStorage.setItem(TURNO_KEY, JSON.stringify(ta)); else localStorage.removeItem(TURNO_KEY); }
    catch(e) { console.error("localStorage:", e); }
  };
  const ordenTurno = (fecha, turno) => (fecha||"") + (turno==="Noche"?"2":"1");
  // Última comanda del turno anterior (o del mismo turno si se está reabriendo).
  // Descarta números mal tipeados que se alejan mucho del resto del turno.
  // Los talonarios traen cada número DOS veces (original y copia):
  //   si la última se usó 1 vez → la siguiente válida es la misma (la copia);
  //   si ya se usó 2 veces → la siguiente es el número siguiente.
  const ultimaComandaAnterior = (fecha, turno) => {
    const actual = ordenTurno(fecha, turno);
    const conNum = facturas.filter(f=>/^\d+$/.test(String(f.comanda||"").trim()) && ordenTurno(f.fecha,f.turno) <= actual);
    if(conNum.length===0) return null;
    const ultimo = conNum.reduce((m,f)=>{ const o=ordenTurno(f.fecha,f.turno); return o>m?o:m; }, "");
    const delTurno = conNum.filter(f=>ordenTurno(f.fecha,f.turno)===ultimo);
    const nums = delTurno.map(f=>parseInt(f.comanda)).sort((a,b)=>a-b);
    const mediana = nums[Math.floor(nums.length/2)];
    const validos = nums.filter(n=>Math.abs(n-mediana)<=300);
    const num = Math.max(...validos);
    const usos = conNum.filter(f=>parseInt(f.comanda)===num).length;
    const esCopia = usos<2;
    return { num, usos, siguiente: esCopia ? num : num+1, esCopia, fecha: delTurno[0].fecha, turno: delTurno[0].turno };
  };
  // Verificar código del administrador contra Supabase (hash SHA-256)
  const verificarPin = async (pin) => {
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
      const hex = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
      const { data } = await supabase.from("seguridad_config").select("pin_autorizacion,codigo_maestro").eq("id","config").single();
      return !!data && (hex===data.pin_autorizacion || hex===data.codigo_maestro);
    } catch(e) { console.error("verificarPin:",e); return false; }
  };
  const iniciarTurno = async (d, motivo="normal") => {
    const ta = { vendedor:d.vendedor, turno:d.turno, fecha:d.fecha, comandaInicial:d.comandaNum,
      hora:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}), inicio:Date.now(),
      motivoAutorizacion:motivo, ultimaAnterior:d.ultima?.num??null, diferencia:d.diferencia??null };
    guardarTurno(ta);
    setCierreFecha(d.fecha); setCierreTurno(d.turno);
    if(pendAnterioresA(d.fecha, d.turno).length>0) setModalTransfAviso(true);
    setHfDesde(d.fecha); setHfHasta(d.fecha); setHfTurno(d.turno);
    irA("nf-tipo");
    setTaComanda(""); setTaVendedor("");
    if(motivo!=="normal") {
      const alerta = { id:gid(), fecha:d.fecha, turno:d.turno, vendedor:d.vendedor,
        comanda_ultima:d.ultima?.num??null, comanda_ingresada:d.comandaNum, diferencia:d.diferencia??0,
        estado:"autorizado", token:gid(), autorizado_at:new Date().toISOString(), created_at:new Date().toISOString() };
      const { error } = await supabase.from("alertas_comanda").insert(alerta);
      if(error) console.error("alertas_comanda insert:", error);
      setAlertasCorr(prev=>[alerta,...prev]);
    }
  };
  const abrirTurno = () => {
    if(!taVendedor) { alert("Seleccioná el vendedor"); return; }
    const comandaNum = parseInt(taComanda);
    if(!comandaNum) { alert("Ingresá el número de la primera comanda del turno"); return; }
    const fecha = taFecha || hoy();
    const ultima = ultimaComandaAnterior(fecha, taTurno);
    const diferencia = ultima ? comandaNum - ultima.siguiente : null; // 0 = sigue la correlatividad
    const d = { vendedor:taVendedor, turno:taTurno, fecha, comandaNum, ultima, diferencia };
    if(ultima && diferencia!==0) { setPinIngresado(""); setPinError(""); setModalAutorizacion(d); return; }
    iniciarTurno(d, "normal");
  };
  const cerrarTurno = () => {
    if(!window.confirm("¿Cerrar el turno? Para cargar más ventas vas a tener que abrir uno nuevo.")) return;
    guardarTurno(null);
  };
  // ── FACTURA IMPRIMIBLE ──
  const guardarDatosLocal = async () => {
    const { error } = await supabase.from("configuracion").upsert({id:"datos_local",tipo:"datos_local",valor:JSON.stringify(datosLocal),activo:true},{onConflict:"id"});
    if(error){ alert("No se pudo guardar: "+error.message); return; }
    setDatosLocalGuardado(true); setTimeout(()=>setDatosLocalGuardado(false),2500);
  };
  const abrirImprimir = async (f) => {
    const cli = clientes.find(c=>c.id===f.clienteId);
    setImpCli({ nombre: f.cliente || (cli?((cli.nombre||"")+" "+(cli.apellido||"")).trim():""), direccion: cli?.direccion||"", telefono: cli?.telefono||"", dni: "" });
    setModalImprimir(f);
    irA("imp-nombre");
    // Traer los productos de esta factura desde la base (la lista general puede venir incompleta en facturas viejas)
    try {
      const { data } = await supabase.from("factura_items").select("*").eq("factura_id", f.id);
      if(data&&data.length) setModalImprimir(m=>m&&m.id===f.id?{...m,items:data.map(i=>({id:i.id,prodId:i.prod_id,nombre:i.nombre,precio:i.precio,qty:i.qty}))}:m);
    } catch(e) { console.error("items factura:",e); }
  };
  // Texto del comprobante para mandar por WhatsApp
  const textoComprobante = (f, nombreCli) => {
    const L = datosLocal; const fechaTxt = f.fecha ? f.fecha.split("-").reverse().join("/") : "";
    const lineas = (f.items||[]).map(i=>`• ${i.qty} x ${i.nombre} — ${fmt(i.precio*i.qty)}`).join("\n");
    return `Hola${nombreCli?" "+nombreCli.split(" ")[0]:""}! 👋 Te enviamos el detalle de tu pedido en ${L.nombre} 🍔\n\n`
      + `🧾 Comprobante ${f.numero} · ${fechaTxt}${f.comanda&&f.comanda!=="—"?" · Comanda #"+f.comanda:""}\n`
      + (lineas?lineas+"\n":"")
      + `\n💰 *Total: ${fmt(f.total)}*\n\n¡Gracias por elegir ${L.nombre}!${L.instagram?" Seguinos en "+L.instagram:""}`;
  };
  // Si el cliente está agendado y le faltaba teléfono/dirección, se completan con lo cargado al imprimir
  const completarDatosCliente = async (f) => {
    const cli = clientes.find(c=>c.id===f.clienteId); if(!cli) return;
    const cambios = {};
    if(!cli.telefono && impCli.telefono.trim()) cambios.telefono = impCli.telefono.trim();
    if(!cli.direccion && impCli.direccion.trim()) cambios.direccion = impCli.direccion.trim();
    if(Object.keys(cambios).length===0) return;
    const { error } = await supabase.from("clientes").update(cambios).eq("id",cli.id);
    if(!error) setClientes(prev=>prev.map(c=>c.id===cli.id?{...c,...cambios}:c));
  };
  const enviarWhatsAppImprimir = () => {
    const f = modalImprimir; if(!f) return;
    completarDatosCliente(f);
    abrirWhatsApp(impCli.telefono, textoComprobante(f, impCli.nombre));
  };
  const imprimirFactura = () => {
    const f = modalImprimir; if(!f) return;
    completarDatosCliente(f);
    const esc = (s) => String(s??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const L = datosLocal;
    const fechaTxt = f.fecha ? f.fecha.split("-").reverse().join("/") : "";
    const pagos = [ [f.medioPago1, f.importe1], [f.medioPago2, f.importe2] ].filter(([m])=>m);
    const filas = (f.items||[]).map(i=>`<tr><td class="c">${esc(i.qty)}</td><td>${esc(i.nombre)}</td><td class="r">${esc(fmt(i.precio))}</td><td class="r b">${esc(fmt(i.precio*i.qty))}</td></tr>`).join("");
    const logoUrl = LOGO_FOODIES;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factura ${esc(f.numero)} - ${esc(L.nombre)}</title>
<style>
@page{size:A4;margin:12mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1c1917;margin:0;background:#e7e5e4}
.hoja{max-width:780px;margin:20px auto;background:#fff;border-radius:14px;box-shadow:0 6px 30px #0002;overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:center;gap:20px;background:#0c0a09;color:#fff;padding:22px 32px;border-bottom:5px solid #dc2626}
.marca{display:flex;gap:16px;align-items:center}.marca img{width:96px;height:96px;border-radius:14px;display:block}
.marca h1{margin:0;font-size:28px;letter-spacing:3px;font-weight:900;color:#fff}.marca h1 span{color:#ef4444}
.marca .sub{font-size:12px;color:#d6d3d1;margin-top:6px;line-height:1.55}
.doc{text-align:right}.doc .t{font-size:11px;letter-spacing:2px;color:#a8a29e;font-weight:700}.doc .n{font-size:24px;font-weight:900;color:#ef4444;margin:2px 0}
.doc .f{font-size:13px;color:#e7e5e4;line-height:1.6}.doc .f b{color:#fff}
.cuerpo{padding:24px 32px 30px}
.cli{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;background:#fef2f2;border:1px solid #fecaca;border-left:5px solid #dc2626;border-radius:10px;padding:14px 18px;margin:0 0 20px;font-size:13px}
.cli b{color:#991b1b;font-size:11px;letter-spacing:1px;text-transform:uppercase;display:block}
table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0c0a09;color:#fff;text-align:left;padding:10px;font-size:11px;letter-spacing:1px;text-transform:uppercase}
td{padding:10px;border-bottom:1px solid #e7e5e4}tr:nth-child(even) td{background:#fafaf9}.c{text-align:center;width:60px}.r{text-align:right;white-space:nowrap}.b{font-weight:700}
.tot{display:flex;justify-content:flex-end;margin-top:16px}.tot div{background:#0c0a09;color:#fff;border-radius:10px;padding:14px 22px;text-align:right;border-bottom:4px solid #dc2626}
.tot small{display:block;font-size:11px;letter-spacing:2px;color:#a8a29e}.tot strong{font-size:30px;color:#ef4444}
.pago{font-size:12px;color:#57534e;margin-top:10px;text-align:right}
.pie{margin-top:28px;text-align:center;font-size:12px;color:#78716c;border-top:1px dashed #d6d3d1;padding-top:16px;line-height:1.7}
.pie .gr{font-size:17px;font-weight:900;color:#dc2626;letter-spacing:.5px}
.barra{max-width:780px;margin:16px auto 0;display:flex;gap:10px;justify-content:flex-end;padding:0 10px}
.barra button{background:#dc2626;color:#fff;border:0;border-radius:8px;padding:12px 22px;font-size:15px;font-weight:700;cursor:pointer}
@media print{body{background:#fff}.hoja{box-shadow:none;margin:0;border-radius:0}.barra{display:none}}
@media (max-width:600px){.hoja{margin:8px}.top{flex-direction:column;align-items:flex-start;padding:18px}.doc{text-align:left}.cuerpo{padding:18px}.cli{grid-template-columns:1fr}.marca img{width:72px;height:72px}}
</style></head><body>
<div class="barra"><button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button></div>
<div class="hoja">
  <div class="top">
    <div class="marca"><img src="${logoUrl}" alt="Logo ${esc(L.nombre)}"><div><h1>${esc(L.nombre).replace(/FOODIES/i,'<span>FOODIES</span>')}</h1>
      <div class="sub">${[L.direccion, L.telefono&&("Tel/WhatsApp: "+L.telefono), L.instagram, L.cuit&&("CUIT: "+L.cuit)].filter(Boolean).map(esc).join("<br>")}</div></div></div>
    <div class="doc"><div class="t">COMPROBANTE DE VENTA</div><div class="n">${esc(f.numero)}</div>
      <div class="f">Fecha: <b>${esc(fechaTxt)}</b><br>${f.comanda&&f.comanda!=="—"?"Comanda: <b>#"+esc(f.comanda)+"</b><br>":""}${esc(f.tipoVenta||"")}${f.vendedor?" · Atendió: "+esc(f.vendedor):""}</div></div>
  </div>
  <div class="cuerpo">
  <div class="cli">
    <div><b>Cliente</b>${esc(impCli.nombre)||"Consumidor final"}</div>
    <div><b>DNI</b>${esc(impCli.dni)||"—"}</div>
    <div><b>Dirección</b>${esc(impCli.direccion)||"—"}</div>
    <div><b>Teléfono</b>${esc(impCli.telefono)||"—"}</div>
  </div>
  <table><thead><tr><th class="c">Cant.</th><th>Descripción</th><th class="r">P. unit.</th><th class="r">Subtotal</th></tr></thead><tbody>${filas}</tbody></table>
  <div class="tot"><div><small>TOTAL</small><strong>${esc(fmt(f.total))}</strong></div></div>
  <div class="pago">Forma de pago: ${pagos.map(([m,imp])=>esc(m)+(parseFloat(imp)?" "+esc(fmt(parseFloat(imp))):"")).join(" + ")}</div>
  <div class="pie"><div class="gr">¡Gracias por elegir ${esc(L.nombre)}!</div>${L.instagram?"Seguinos en "+esc(L.instagram)+"<br>":""}${L.telefono?"Pedidos: "+esc(L.telefono)+"<br>":""}<span style="font-size:10px">Documento no válido como factura fiscal</span></div>
  </div>
</div>
<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})</script>
</body></html>`;
    const w = window.open("","_blank");
    if(!w){ alert("El navegador bloqueó la ventana. Permití las ventanas emergentes para esta página."); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setModalImprimir(null);
  };

  const marcarAlertaVista = async (id) => {
    await supabase.from("alertas_comanda").update({estado:"visto"}).eq("id",id);
    setAlertasCorr(prev=>prev.filter(a=>a.id!==id));
  };

  const guardar = async () => {
    if(!turnoActivo) { alert("Primero abrí el turno."); return; }
    if(nf.items.length===0) return;
    if(guardandoNf.current) return; // evita guardar dos veces con doble Enter/toque
    guardandoNf.current = true;
    try { await guardarFactura(); } finally { guardandoNf.current = false; }
  };
  const guardarFactura = async () => {
    // Fecha, turno y vendedor salen de la apertura del turno
    nf.fecha = turnoActivo.fecha; nf.turno = turnoActivo.turno; nf.vendedor = turnoActivo.vendedor;
    // Verificar si el turno ya está cerrado
    const turnoYaCerrado = cierres.find(c=>c.fecha===nf.fecha&&c.turno===nf.turno);
    if(turnoYaCerrado&&!esAdmin) {
      alert(`⚠️ El turno ${nf.turno} del ${nf.fecha} ya fue cerrado. No se puede cargar facturas. Pedile al administrador que elimine el cierre para reabrirlo.`);
      return;
    }
    if(turnoYaCerrado&&esAdmin) {
      const confirmar = window.confirm(`⚠️ El turno ${nf.turno} del ${nf.fecha} ya fue cerrado. ¿Querés agregar esta factura de todas formas?`);
      if(!confirmar) return;
    }
    // Auto-completar importe1 si está en 0 y no hay medio2
    const totalItems2 = nf.items.reduce((s,i)=>s+i.precio*i.qty,0);
    if((!nf.importe1||parseFloat(nf.importe1)===0)&&!nf.medioPago2) {
      setNf(p=>({...p,importe1:String(totalItems2)}));
      nf.importe1 = String(totalItems2);
    }
    const hayTransfer = nf.medioPago1==="Transferencia"||nf.medioPago2==="Transferencia";
    const id = gid();
    const f = { id, numero:`FOO-${String(facturas.length+1).padStart(5,"0")}`,
      comanda:nf.comanda||"—", fecha:nf.fecha, turno:nf.turno, tipoVenta:nf.tipoVenta,
      vendedor:nf.vendedor, cadete:nf.cadete||"—",
      cliente:clientes.find(c=>c.id===nf.clienteId)?.nombre||"", clienteId:nf.clienteId,
      medioPago1:nf.medioPago1, importe1:parseFloat(nf.importe1)||0,
      medioPago2:nf.medioPago2||"", importe2:parseFloat(nf.importe2)||0,
      transferConfirmada:hayTransfer?false:null,
      items:[...nf.items], total:totalItems, notas:nf.notas, estado:"pagada" };
    await supabase.from("facturas").insert({ id, numero:f.numero, comanda:f.comanda, fecha:f.fecha, turno:f.turno,
      tipo_venta:f.tipoVenta, vendedor:f.vendedor, cadete:f.cadete, cliente:f.cliente, cliente_id:f.clienteId||"",
      medio_pago1:f.medioPago1, importe1:f.importe1, medio_pago2:f.medioPago2, importe2:f.importe2,
      transfer_confirmada:f.transferConfirmada, total:f.total, notas:f.notas, estado:f.estado });
    await supabase.from("factura_items").insert(nf.items.map(i=>({id:i.id,factura_id:id,prod_id:i.prodId,nombre:i.nombre,precio:i.precio,qty:i.qty})));
    setFacturas(prev=>[f,...prev]); setNf(emptyNf()); setNfCliBusq(""); setNfCliNew(false); setNfCliNewApe(""); setNfCliNewTel(""); setNfReset(r=>r+1);
    // Se queda en la carga de facturas, lista para la siguiente (antes saltaba al historial)
    setSelBusq(""); setSelProd(""); setSelQty(""); setSelPrecio("");
    setNfOk(`✅ Factura ${f.numero} guardada${f.comanda&&f.comanda!=="—"?" · comanda #"+f.comanda:""} · ${fmt(f.total)}`);
    setTimeout(()=>setNfOk(""), 5000);
    try { window.scrollTo({top:0,behavior:"smooth"}); } catch(e) {}
    // En la compu el cursor vuelve a Tipo de venta; en el celular no (abriría el teclado solo)
    try { if(window.matchMedia("(hover: hover)").matches) irA("nf-tipo"); } catch(e) {}
  };

  const confirmarTransfer = async (id) => {
    await supabase.from("facturas").update({transfer_confirmada:true}).eq("id",id);
    setFacturas(prev=>prev.map(f=>f.id===id?{...f,transferConfirmada:true}:f));
  };

  const abrirEdicion = (f) => setEditando({...f,items:[...f.items]});

  const eliminarFactura = async (id) => {
    if(!window.confirm("¿Eliminar esta factura?")) return;
    await supabase.from("factura_items").delete().eq("factura_id",id);
    await supabase.from("facturas").delete().eq("id",id);
    setFacturas(prev=>prev.filter(f=>f.id!==id));
  };

  const editAddItem = () => {
    const p = productos.find(x=>x.id===editSelProd); if(!p||!editando) return;
    const precio = editSelPrecio!==""?parseFloat(editSelPrecio):p.precio;
    const qty = parseInt(editSelQty)||1;
    const ex = editando.items.find(i=>i.prodId===p.id&&i.precio===precio);
    if(ex) setEditando(prev=>({...prev,items:prev.items.map(i=>i.prodId===p.id&&i.precio===precio?{...i,qty:i.qty+qty}:i)}));
    else setEditando(prev=>({...prev,items:[...prev.items,{id:gid(),prodId:p.id,nombre:p.nombre,precio,qty}]}));
    setEditSelProd(""); setEditSelQty(""); setEditSelPrecio("");
  };

  const guardarEdicion = async () => {
    if(!editando) return;
    const total = editando.items.reduce((s,i)=>s+i.precio*i.qty,0);
    const hayTransfer = editando.medioPago1==="Transferencia"||editando.medioPago2==="Transferencia";
    await supabase.from("facturas").update({
      comanda:editando.comanda, fecha:editando.fecha, turno:editando.turno, tipo_venta:editando.tipoVenta,
      vendedor:editando.vendedor, cadete:editando.cadete, medio_pago1:editando.medioPago1,
      importe1:editando.importe1, medio_pago2:editando.medioPago2, importe2:editando.importe2,
      transfer_confirmada:hayTransfer?(editando.transferConfirmada??false):null, total, notas:editando.notas
    }).eq("id",editando.id);
    setFacturas(prev=>prev.map(f=>f.id===editando.id?{...editando,total,transferConfirmada:hayTransfer?(editando.transferConfirmada??false):null}:f));
    setEditando(null);
  };

  const registrarPagoCC = async () => {
    if(!ccCliente||!ccMonto) return;
    const cli = clientes.find(c=>c.id===ccCliente); const id = gid();
    // El nombre sale del cliente o, si la deuda se cargó solo con nombre, de la lista de saldos
    const nombre = (cli?((cli.nombre||"")+" "+(cli.apellido||"")).trim():"") || saldosCC.find(x=>x.key===ccCliente)?.nombre || ccCliente;
    const { error } = await supabase.from("pagos_cc").insert({id,cliente_id:ccCliente,cliente_nombre:nombre,monto:parseFloat(ccMonto),fecha:hoy(),obs:ccObs});
    if(error){ alert("No se pudo registrar el pago: "+error.message); return; }
    setPagosCC(prev=>[...prev,{id,clienteId:ccCliente,clienteNombre:nombre,monto:parseFloat(ccMonto),fecha:hoy(),obs:ccObs}]);
    setCcCliente(""); setCcMonto(""); setCcObs("");
  };

  // ── CAJA ──
  const factCierre = facturas.filter(f=>f.fecha===cierreFecha&&f.turno===cierreTurno&&f.estado==="pagada");
  // Si importe es 0 y es el único medio de pago, usar el total de la factura
  const getEfectivo = (f) => {
    const imp1 = f.medioPago1==="Efectivo" ? (parseFloat(f.importe1)||0) : 0;
    const imp2 = f.medioPago2==="Efectivo" ? (parseFloat(f.importe2)||0) : 0;
    // Si solo tiene medio1 y el importe es 0, usar el total
    if(f.medioPago1==="Efectivo" && !f.medioPago2 && imp1===0) return f.total;
    return imp1 + imp2;
  };
  const getTransfer = (f) => {
    const imp1 = f.medioPago1==="Transferencia" ? (parseFloat(f.importe1)||0) : 0;
    const imp2 = f.medioPago2==="Transferencia" ? (parseFloat(f.importe2)||0) : 0;
    if(f.medioPago1==="Transferencia" && !f.medioPago2 && imp1===0) return f.total;
    return imp1 + imp2;
  };
  const getCC = (f) => {
    const imp1 = f.medioPago1==="Cuenta Corriente" ? (parseFloat(f.importe1)||0) : 0;
    const imp2 = f.medioPago2==="Cuenta Corriente" ? (parseFloat(f.importe2)||0) : 0;
    if(f.medioPago1==="Cuenta Corriente" && !f.medioPago2 && imp1===0) return f.total;
    return imp1 + imp2;
  };
  const cierreEf = factCierre.reduce((s,f)=>s+getEfectivo(f),0);
  const cierreTrConf = factCierre.filter(f=>tieneTransfer(f)&&f.transferConfirmada===true).reduce((s,f)=>s+getTransfer(f),0);
  const cierreTrPend = factCierre.filter(f=>tieneTransfer(f)&&f.transferConfirmada===false);
  const cierreTrPendMonto = cierreTrPend.reduce((s,f)=>s+getTransfer(f),0);
  const cierreCC = factCierre.reduce((s,f)=>s+getCC(f),0);
  // Gastos y retiros del turno actual (aún no vinculados a ningún cierre)
  const grTurno = gastosRetiros.filter(g=>g.fecha===cierreFecha&&g.turno===cierreTurno&&!g.cierreId);
  const gastosContado = grTurno.filter(g=>g.tipo==="Gasto").reduce((s,g)=>s+g.monto,0);
  const retirosContado = grTurno.filter(g=>g.tipo==="Retiro").reduce((s,g)=>s+g.monto,0);
  const efectivoContado = parseFloat(cierreEfectivo)||0;
  // Fórmula: (Efectivo físico + Gastos + Retiros) vs Ventas en efectivo
  const efectivoEsperado = efectivoContado + gastosContado + retirosContado;
  const difCaja = efectivoEsperado - cierreEf;

  const guardarGastoRetiro = async () => {
    if(!grConcepto||grMonto==="") return;
    const id = gid();
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2,"0")}:${String(ahora.getMinutes()).padStart(2,"0")}`;
    const reg = {id,fecha:cierreFecha,hora:horaActual,turno:cierreTurno,tipo:grTipo,concepto:grConcepto,monto:parseFloat(grMonto)||0,cierreId:null};
    const { error } = await supabase.from("gastos_retiros").insert({id,fecha:cierreFecha,hora:horaActual,turno:cierreTurno,tipo:grTipo,concepto:grConcepto,monto:parseFloat(grMonto)||0});
    if(error){ alert("No se pudo guardar: "+error.message); return; }
    setGastosRetiros(prev=>[reg,...prev]);
    setGrConcepto(""); setGrMonto("");
  };

  const eliminarGastoRetiro = async (id) => {
    if(!window.confirm("¿Eliminar este registro?")) return;
    await supabase.from("gastos_retiros").delete().eq("id",id);
    setGastosRetiros(prev=>prev.filter(g=>g.id!==id));
  };

  const generarReporteDia = (cierre) => {
    const factTurnoTodas = facturas.filter(f=>f.fecha===cierre.fecha&&f.turno===cierre.turno);
    const factDia = factTurnoTodas.filter(f=>f.estado==="pagada");
    const trPend = factDia.filter(f=>tieneTransfer(f)&&f.transferConfirmada===false);
    const grDia = gastosRetiros.filter(g=>g.cierreId===cierre.id);
    const cantEnvio = factDia.filter(f=>f.tipoVenta==="Envio").length;
    const cantMostrador = factDia.filter(f=>f.tipoVenta==="Mostrador").length;
    const cantSalon = factDia.filter(f=>f.tipoVenta==="Salon").length;
    const prodMap = {};
    factDia.forEach(f=>(f.items||[]).forEach(it=>{
      if(it.nombre==="ENVIO") return;
      if(!prodMap[it.nombre]) prodMap[it.nombre]={qty:0,total:0};
      prodMap[it.nombre].qty+=it.qty; prodMap[it.nombre].total+=it.qty*it.precio;
    }));
    const topProductos = Object.entries(prodMap).sort((a,b)=>b[1].qty-a[1].qty).slice(0,10);
    const comandasNum = factTurnoTodas.map(f=>f.comanda).filter(x=>x&&x!=="—"&&!isNaN(parseInt(x))).map(x=>parseInt(x));
    const conteo = {}; comandasNum.forEach(n=>{conteo[n]=(conteo[n]||0)+1;});
    const nums = Object.keys(conteo).map(Number).sort((a,b)=>a-b);
    // Usar comanda inicial del turno si está registrada
    const cmdInicial = cierre.comandaInicial || (nums.length>0?nums[0]:null);
    const cmdFinal = nums.length>0?nums[nums.length-1]:null;

    // Verificar salto entre turno anterior y este turno
    const ordT = (c)=>(c.fecha||"")+(c.turno==="Noche"?"2":"1");
    const cierresOrdenados = cierres.filter(x=>x.id!==cierre.id&&ordT(x)<ordT(cierre)).sort((a,b)=>ordT(b).localeCompare(ordT(a)));
    const cierreAnterior = cierresOrdenados[0]||null;
    const ultimaCmdAnterior = cierreAnterior ? facturas
      .filter(f=>f.fecha===cierreAnterior.fecha&&f.turno===cierreAnterior.turno&&f.comanda&&f.comanda!=="—"&&!isNaN(parseInt(f.comanda)))
      .reduce((max,f)=>Math.max(max,parseInt(f.comanda)),0)||null : null;
    const saltoEntreTurnos = (cmdInicial&&ultimaCmdAnterior) ? Math.max(0, cmdInicial - ultimaCmdAnterior - 1) : null;

    const faltantes=[],incompletos=[],saltosGraves=[];
    if(cmdInicial&&cmdFinal){
      for(let n=cmdInicial;n<=cmdFinal;n++){
        const cant=conteo[n]||0;
        if(cant===0) faltantes.push(n);
        else if(cant===1) incompletos.push(n);
      }
      let inicio=null;
      for(let n=cmdInicial;n<=cmdFinal;n++){
        if((conteo[n]||0)===0){if(!inicio)inicio=n;}
        else{if(inicio&&n-inicio>=3)saltosGraves.push({desde:inicio,hasta:n-1,cant:n-inicio});inicio=null;}
      }
      if(inicio&&cmdFinal-inicio>=2)saltosGraves.push({desde:inicio,hasta:cmdFinal,cant:cmdFinal-inicio+1});
    }
    const hayProblemas = faltantes.length>0||incompletos.length>0||(saltoEntreTurnos!==null&&saltoEntreTurnos>0);
    const difTransfer = factDia.filter(f=>{
      const tr=(f.medioPago1==="Transferencia"?(parseFloat(f.importe1)||0):0)+(f.medioPago2==="Transferencia"?(parseFloat(f.importe2)||0):0);
      return tr>0&&Math.abs(tr-f.total)>1;
    }).map(f=>{
      const tr=(f.medioPago1==="Transferencia"?(parseFloat(f.importe1)||0):0)+(f.medioPago2==="Transferencia"?(parseFloat(f.importe2)||0):0);
      return {numero:f.numero,comanda:f.comanda,cliente:f.cliente||"—",totalFactura:f.total,transferido:tr,diferencia:tr-f.total};
    });
    const sumaDifTransfer = difTransfer.reduce((s,x)=>s+x.diferencia,0);
    const difPrecios = [];
    factDia.forEach(f=>(f.items||[]).forEach(it=>{
      if(it.nombre==="ENVIO") return;
      const prodActual = productos.find(p=>p.id===it.prodId||p.nombre===it.nombre);
      if(prodActual&&Math.abs(prodActual.precio-it.precio)>1)
        difPrecios.push({numero:f.numero,comanda:f.comanda,producto:it.nombre,precioLista:prodActual.precio,precioCobrado:it.precio,qty:it.qty,diferencia:(it.precio-prodActual.precio)*it.qty});
    }));
    const cuadraEf = cierre.diferencia===0;
    const cuadraTransf = cierre.transferPendiente===0;
    const todoCuadra = cuadraEf&&cuadraTransf;
    const w = window.open("","_blank","width=850,height=700");
    if(!w){alert("Permitir ventanas emergentes");return;}
    let html = "";
    try {
    html += "<!DOCTYPE html><html><head><title>Reporte "+cierre.fecha+" - "+cierre.turno+"</title>";
    html += "<style>body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:800px;margin:0 auto}";
    html += "h1{font-size:22px;text-align:center}.sub{text-align:center;font-size:12px;color:#666;margin-bottom:24px}";
    html += "h2{font-size:14px;margin-top:24px;border-bottom:2px solid #111;padding-bottom:4px}";
    html += "table{width:100%;border-collapse:collapse;margin-bottom:8px}th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left}th{background:#f0f0f0}";
    html += ".ok{background:#f0fdf4;border:1px solid #22c55e;border-radius:8px;padding:14px;font-weight:900;color:#166534;text-align:center;font-size:18px}";
    html += ".danger{background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:14px;color:#991b1b}";
    html += ".resumen{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{border:1px solid #ddd;border-radius:6px;padding:10px;text-align:center}";
    html += ".box .v{font-size:18px;font-weight:800}.box .l{font-size:10px;color:#666;text-transform:uppercase}</style></head><body>";
    // Calculos para el reporte
    const totalEfectivo = factDia.reduce((s,f)=>s+getEfectivo(f),0);
    const totalTransfer = factDia.reduce((s,f)=>s+getTransfer(f),0);
    const totalCC = factDia.reduce((s,f)=>s+getCC(f),0);
    const totalVentas = totalEfectivo + totalTransfer + totalCC;
    const trConf = factDia.filter(f=>tieneTransfer(f)&&f.transferConfirmada===true);
    const trConfMonto = trConf.reduce((s,f)=>s+montoTransfer(f),0);
    const trPendMonto = trPend.reduce((s,f)=>s+montoTransfer(f),0);
    const gastosT = grDia.length>0 ? grDia.filter(g=>g.tipo==="Gasto").reduce((s,g)=>s+g.monto,0) : (cierre.gastosContado||0);
    const retirosT = grDia.length>0 ? grDia.filter(g=>g.tipo==="Retiro").reduce((s,g)=>s+g.monto,0) : (cierre.retiros||0);
    const sumaFisica = cierre.efectivoContado + gastosT + retirosT;
    const difEf = sumaFisica - totalEfectivo;

    html += "<h1>FOODIES LK</h1><div class='sub'>Cierre — "+cierre.fecha+" · Turno "+cierre.turno+"</div>";

    // ══ SECCIÓN 1: TOTAL VENTAS DEL TURNO ══
    html += "<h2>💰 TOTAL VENTAS DEL TURNO</h2>";
    html += "<table>";
    html += "<tr style='background:#e8f5e9'><td><b>💵 Efectivo</b></td><td style='text-align:right;font-weight:700'>"+fmt(totalEfectivo)+"</td></tr>";
    html += "<tr style='background:#e3f2fd'><td><b>📲 Transferencia</b></td><td style='text-align:right;font-weight:700'>"+fmt(totalTransfer)+"</td></tr>";
    if(totalCC>0) html += "<tr style='background:#ede7f6'><td><b>🏦 Cuenta Corriente</b></td><td style='text-align:right;font-weight:700'>"+fmt(totalCC)+"</td></tr>";
    html += "<tr style='background:#fff3e0;font-size:16px'><td><b>TOTAL VENDIDO</b></td><td style='text-align:right;font-weight:900'>"+fmt(totalVentas)+"</td></tr>";
    html += "</table>";

    // ══ SECCIÓN 2: EFECTIVO ══
    html += "<h2>💵 EFECTIVO</h2>";
    html += "<table>";
    html += "<tr><td>Venta en efectivo (sistema)</td><td style='text-align:right;font-weight:700'>"+fmt(totalEfectivo)+"</td></tr>";
    html += "<tr style='border-top:2px solid #ddd'><td>Efectivo físico contado</td><td style='text-align:right;font-weight:700'>"+fmt(cierre.efectivoContado)+"</td></tr>";
    if(gastosT>0) html += "<tr><td>&nbsp;&nbsp;+ Gastos del turno</td><td style='text-align:right;color:#dc2626'>"+fmt(gastosT)+"</td></tr>";
    if(retirosT>0) html += "<tr><td>&nbsp;&nbsp;+ Retiros del turno</td><td style='text-align:right;color:#f59e0b'>"+fmt(retirosT)+"</td></tr>";
    html += "<tr style='background:#e8f5e9'><td><b>Suma (físico + gastos + retiros)</b></td><td style='text-align:right;font-weight:700'>"+fmt(sumaFisica)+"</td></tr>";
    const colorDifEf = difEf===0?"#16a34a":difEf>0?"#16a34a":"#dc2626";
    html += "<tr style='border-top:2px solid #111;font-weight:900'><td>DIFERENCIA</td><td style='text-align:right;color:"+colorDifEf+"'>"+(difEf===0?"✓ CUADRA":(difEf>0?"+"+fmt(difEf)+" (SOBRA)":fmt(difEf)+" (FALTA)"))+"</td></tr>";
    html += "</table>";
    if(grDia.length>0){
      html += "<p style='font-size:11px;color:#666;margin-top:4px'><b>Detalle gastos/retiros:</b> ";
      grDia.forEach(g=>{html += g.hora+" "+g.tipo+": "+g.concepto+" "+fmt(g.monto)+" · ";});
      html += "</p>";
    }

    // ══ SECCIÓN 3: TRANSFERENCIAS ══
    html += "<h2>📲 TRANSFERENCIAS</h2>";
    html += "<table>";
    html += "<tr><td>Total transferencias del turno</td><td style='text-align:right;font-weight:700'>"+fmt(totalTransfer)+"</td></tr>";
    html += "<tr style='color:#16a34a'><td>&nbsp;&nbsp;✅ Confirmadas ("+trConf.length+")</td><td style='text-align:right;font-weight:700'>"+fmt(trConfMonto)+"</td></tr>";
    html += "<tr style='color:#dc2626'><td>&nbsp;&nbsp;⏳ Pendientes ("+trPend.length+")</td><td style='text-align:right;font-weight:700'>"+fmt(trPendMonto)+"</td></tr>";
    html += "</table>";
    if(trPend.length>0){
      html += "<p style='font-weight:700;color:#dc2626;margin-top:8px'>⚠️ Transferencias pendientes de confirmar:</p>";
      html += "<table><thead><tr><th>N° Fact.</th><th>Comanda</th><th>Cliente</th><th>Vendedor</th><th>Monto</th></tr></thead><tbody>";
      trPend.forEach(f=>{
        html += "<tr style='background:#fef2f2'>";
        html += "<td>#"+f.numero+"</td>";
        html += "<td>"+(f.comanda!=="—"?"#"+f.comanda:"—")+"</td>";
        html += "<td>"+(f.cliente||"—")+"</td>";
        html += "<td>"+f.vendedor+"</td>";
        html += "<td style='text-align:right;font-weight:700;color:#dc2626'>"+fmt(montoTransfer(f))+"</td>";
        html += "</tr>";
      });
      html += "</tbody></table>";
    }

    // ══ SECCIÓN 4: CUENTA CORRIENTE (si aplica) ══
    if(totalCC>0){
      const facturasCC = factDia.filter(f=>(f.medioPago1==="Cuenta Corriente"||(f.medioPago2==="Cuenta Corriente"&&f.importe2>0)));
      html += "<h2>🏦 CUENTA CORRIENTE</h2>";
      html += "<table>";
      html += "<tr><td>Total en Cuenta Corriente</td><td style='text-align:right;font-weight:700'>"+fmt(totalCC)+"</td></tr>";
      html += "</table>";
      html += "<table><thead><tr><th>N° Fact.</th><th>Comanda</th><th>Cliente</th><th>Monto CC</th></tr></thead><tbody>";
      facturasCC.forEach(f=>{
        const montoCC=getCC(f);
        html += "<tr><td>#"+f.numero+"</td><td>"+(f.comanda!=="—"?"#"+f.comanda:"—")+"</td><td>"+(f.cliente||"—")+"</td><td style='text-align:right;font-weight:700'>"+fmt(montoCC)+"</td></tr>";
      });
      html += "</tbody></table>";
    }
    if(difTransfer.length>0){
      html += "<h2 style='color:"+(sumaDifTransfer>=0?"#16a34a":"#dc2626")+"'>📲 Diferencias en Transferencias</h2>";
      html += "<table><thead><tr><th>N°</th><th>Comanda</th><th>Cliente</th><th>Total comanda</th><th>Transfirió</th><th>Diferencia</th></tr></thead><tbody>";
      difTransfer.forEach(x=>{ html += "<tr><td>#"+x.numero+"</td><td>"+(x.comanda!=="—"?"#"+x.comanda:"—")+"</td><td>"+x.cliente+"</td><td>"+fmt(x.totalFactura)+"</td><td>"+fmt(x.transferido)+"</td><td style='font-weight:700;color:"+(x.diferencia>0?"#16a34a":"#dc2626")+"'>"+(x.diferencia>0?"+":"")+fmt(x.diferencia)+"</td></tr>"; });
      html += "</tbody><tfoot><tr style='border-top:2px solid #111;font-weight:bold'><td colspan='5'>DIFERENCIA NETA</td><td style='color:"+(sumaDifTransfer>=0?"#16a34a":"#dc2626")+"'>"+(sumaDifTransfer>0?"+":"")+fmt(sumaDifTransfer)+"</td></tr></tfoot></table>";
    }
    if(difPrecios.length>0){
      html += "<h2 style='color:#92400e'>💰 Modificaciones de Precio</h2>";
      html += "<table><thead><tr><th>N°</th><th>Comanda</th><th>Producto</th><th>Lista</th><th>Cobrado</th><th>Cant.</th><th>Diferencia</th></tr></thead><tbody>";
      difPrecios.forEach(x=>{ html += "<tr><td>#"+x.numero+"</td><td>"+(x.comanda!=="—"?"#"+x.comanda:"—")+"</td><td>"+x.producto+"</td><td>"+fmt(x.precioLista)+"</td><td style='font-weight:700'>"+fmt(x.precioCobrado)+"</td><td>"+x.qty+"</td><td style='font-weight:700;color:"+(x.diferencia>0?"#16a34a":"#dc2626")+"'>"+(x.diferencia>0?"+":"")+fmt(x.diferencia)+"</td></tr>"; });
      const tdif = difPrecios.reduce((s,x)=>s+x.diferencia,0);
      html += "</tbody><tfoot><tr style='border-top:2px solid #111;font-weight:bold'><td colspan='6'>IMPACTO TOTAL</td><td style='color:"+(tdif>=0?"#16a34a":"#dc2626")+"'>"+(tdif>0?"+":"")+fmt(tdif)+"</td></tr></tfoot></table>";
    }
    html += "<h2>🔢 CORRELATIVIDAD DE COMANDAS</h2>";
    if(!cmdInicial||!cmdFinal) {
      html += "<div style='background:#fef9c3;border:1px solid #eab308;border-radius:8px;padding:12px;color:#854d0e'>";
      html += "<b>⚠️ No se registró comanda inicial al abrir el turno.</b><br>";
      html += "<span style='font-size:12px'>Sin ese dato no se puede verificar si faltan comandas. Registrar la comanda inicial es OBLIGATORIO al iniciar cada turno.</span>";
      html += "</div>";
    } else {
      const totalRango = cmdFinal - cmdInicial + 1;
      html += "<div style='background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px;margin-bottom:10px'>";
      html += "<table style='border:none'>";
      if(ultimaCmdAnterior) html += "<tr><td style='border:none;color:#555'>Última comanda turno anterior</td><td style='border:none;font-weight:700'>#"+ultimaCmdAnterior+" ("+cierreAnterior.fecha+" "+cierreAnterior.turno+")</td></tr>";
      html += "<tr><td style='border:none;color:#555'>Comanda inicial de este turno</td><td style='border:none;font-weight:700'>#"+cmdInicial+"</td></tr>";
      html += "<tr><td style='border:none;color:#555'>Última comanda de este turno</td><td style='border:none;font-weight:700'>#"+cmdFinal+"</td></tr>";
      html += "<tr><td style='border:none;color:#555'>Total comandas en rango</td><td style='border:none;font-weight:700'>"+totalRango+"</td></tr>";
      html += "<tr><td style='border:none;color:#555'>Comandas registradas</td><td style='border:none;font-weight:700'>"+nums.length+"</td></tr>";
      if(saltoEntreTurnos!==null) html += "<tr style='background:"+(saltoEntreTurnos===0?"#f0fdf4":"#fef2f2")+"'><td style='border:none;font-weight:700'>Salto entre turnos</td><td style='border:none;font-weight:700;color:"+(saltoEntreTurnos===0?"#16a34a":"#dc2626")+"'>"+( saltoEntreTurnos===0?"✅ Ninguno":"⚠️ "+saltoEntreTurnos+" comanda(s) sin registrar entre turnos")+"</td></tr>";
      html += "</table></div>";

      if(!hayProblemas) {
        html += "<div style='background:#f0fdf4;border:2px solid #22c55e;border-radius:8px;padding:16px;text-align:center'>";
        html += "<div style='font-size:22px'>✅</div>";
        html += "<div style='font-weight:900;color:#166534;font-size:16px'>CORRELATIVIDAD CONFIRMADA</div>";
        html += "<div style='color:#15803d;font-size:12px;margin-top:4px'>Todas las comandas del #"+cmdInicial+" al #"+cmdFinal+" están registradas correctamente.</div>";
        html += "</div>";
      } else {
        html += "<div style='background:#fef2f2;border:2px solid #ef4444;border-radius:8px;padding:14px;margin-bottom:12px'>";
        html += "<div style='font-size:18px;font-weight:900;color:#991b1b;margin-bottom:8px'>🚨 ALERTA: SE DETECTARON IRREGULARIDADES</div>";

        if(saltoEntreTurnos>0) {
          html += "<div style='background:#7f1d1d;color:#fecaca;border-radius:6px;padding:10px;margin-bottom:10px'>";
          html += "<b>🔴 SALTO ENTRE TURNOS:</b><br>";
          html += "La última comanda del turno anterior fue #"+ultimaCmdAnterior+" y este turno arrancó en #"+cmdInicial+".<br>";
          html += "Hay <b>"+saltoEntreTurnos+" comanda(s)</b> que no están registradas en ningún turno.<br>";
          html += "</div>";
        }

        if(saltosGraves.length>0) {
          html += "<div style='background:#7f1d1d;color:#fecaca;border-radius:6px;padding:10px;margin-bottom:10px'>";
          html += "<b>🔴 SALTOS GRAVES (más de 2 comandas seguidas sin registrar):</b><br>";
          saltosGraves.forEach(s=>{
            html += "• Del #"+s.desde+" al #"+s.hasta+" — "+s.cant+" comandas DESAPARECIDAS<br>";
          });
          html += "</div>";
        }

        if(faltantes.length>0) {
          html += "<div style='margin-bottom:10px'>";
          html += "<b style='color:#991b1b'>❌ Comandas que NO aparecen en el sistema ("+faltantes.length+"):</b><br>";
          html += "<div style='font-family:monospace;margin-top:4px;font-size:13px'>"+faltantes.map(n=>"#"+n).join(" · ")+"</div>";
          html += "</div>";
        }

        if(incompletos.length>0) {
          html += "<div style='margin-bottom:6px'>";
          html += "<b style='color:#9a3412'>⚠️ Comandas que aparecen solo 1 vez ("+incompletos.length+") — deberían aparecer en ambos turnos:</b><br>";
          html += "<div style='font-family:monospace;margin-top:4px;font-size:13px'>"+incompletos.map(n=>"#"+n).join(" · ")+"</div>";
          html += "</div>";
        }

        html += "<div style='margin-top:10px;padding-top:10px;border-top:1px solid #fca5a5;font-size:12px;color:#7f1d1d'>";
        html += "<b>RESUMEN:</b> De "+totalRango+" comandas esperadas, "+faltantes.length+" no están en el sistema";
        if(incompletos.length>0) html += " y "+incompletos.length+" aparecen incompletas";
        html += ". Verificar con el personal del turno.";
        html += "</div>";
        html += "</div>";
      }
    }
    html += "<h2>🛒 Top 10 Artículos</h2>";
    if(topProductos.length===0) html += "<p style='color:#666'>Sin datos</p>";
    else { html += "<table><thead><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr></thead><tbody>"; topProductos.forEach(([nombre,d])=>{html += "<tr><td>"+nombre+"</td><td style='text-align:right'>"+d.qty+"</td><td style='text-align:right'>"+fmt(d.total)+"</td></tr>";}); html += "</tbody></table>"; }
    html += "<h2>📦 Pedidos por Canal</h2>";
    html += "<div class='resumen'><div class='box'><div class='v'>"+cantEnvio+"</div><div class='l'>🛵 Envío</div></div>";
    html += "<div class='box'><div class='v'>"+cantMostrador+"</div><div class='l'>🏪 Mostrador</div></div>";
    html += "<div class='box'><div class='v'>"+cantSalon+"</div><div class='l'>🍽 Salón</div></div></div>";
    if(cierre.obs) html += "<p style='margin-top:14px;font-size:12px;color:#92400e'><b>Obs:</b> "+cierre.obs+"</p>";
    html += "</body></html>";
    } catch(err) {
      html = "<!DOCTYPE html><html><body style='font-family:Arial;padding:30px;color:red'>";
      html += "<h2>Error generando el reporte</h2><pre>"+String(err)+"</pre></body></html>";
    }
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  const guardarCierre = async () => {
    const quedan = [...cierreTrPend, ...transfPendAntesCierre];
    if(quedan.length>0 && !window.confirm(`⚠️ Quedan ${quedan.length} transferencia${quedan.length!==1?"s":""} SIN CONFIRMAR por ${fmt(quedan.reduce((s,f)=>s+montoTransfer(f),0))} (${cierreTrPend.length} de este turno y ${transfPendAntesCierre.length} de turnos anteriores).\n\n¿Cerrar la caja igual?`)) return;
    const id = gid();
    const esTurnoAbierto = turnoActivo&&turnoActivo.fecha===cierreFecha&&turnoActivo.turno===cierreTurno;
    const comandaInicial = esTurnoAbierto ? turnoActivo.comandaInicial : null;
    const c = {id,fecha:cierreFecha,turno:cierreTurno,facturas:factCierre.length,
      efectivo:cierreEf,transferConfirmada:cierreTrConf,transferPendiente:cierreTrPendMonto,
      cuentaCorriente:cierreCC,efectivoContado,gastosContado,retiros:retirosContado,efectivoEsperado,diferencia:difCaja,obs:cierreObs,comandaInicial};
    if(grTurno.length>0){
      await supabase.from("gastos_retiros").update({cierre_id:id}).in("id",grTurno.map(g=>g.id));
      setGastosRetiros(prev=>prev.map(g=>grTurno.find(x=>x.id===g.id)?{...g,cierreId:id}:g));
    }
    const { error } = await supabase.from("cierres_caja").insert({id,fecha:cierreFecha,turno:cierreTurno,facturas_count:factCierre.length,
      efectivo:cierreEf,transfer_confirmada:cierreTrConf,transfer_pendiente:cierreTrPendMonto,cuenta_corriente:cierreCC,
      efectivo_contado:efectivoContado,gastos:gastosContado,retiros:retirosContado,efectivo_esperado:efectivoEsperado,diferencia:difCaja,obs:cierreObs,
      comanda_inicial:comandaInicial});
    if(error){ alert("No se pudo guardar el cierre: "+error.message); return; }
    setCierres(prev=>[c,...prev]); setCierreEfectivo(""); setCierreObs("");
    // Si se cerró la caja del turno abierto, el turno se cierra solo
    if(esTurnoAbierto) {
      guardarTurno(null);
      alert("✅ Cierre guardado. El turno quedó cerrado.");
    }
  };

  const eliminarCierre = async (id) => {
    if(!window.confirm("¿Eliminar este cierre? Esto permite volver a cargar facturas en ese turno.")) return;
    await supabase.from("cierres_caja").delete().eq("id",id);
    setCierres(prev=>prev.filter(c=>c.id!==id));
  };

  // ── COMPRAS ──
  const totalNc = nc.items.reduce((s,i)=>s+i.precio*i.qty,0);

  const guardarCompra = async () => {
    if(!nc.proveedor||nc.items.length===0) return;
    const id = gid();
    const total = nc.items.reduce((s,i)=>s+i.precio*i.qty,0);
    const comp = { id, numero:`COM-${String(compras.length+1).padStart(5,"0")}`,
      fecha:nc.fecha, proveedor:nc.proveedor, nroFactura:nc.nroFactura,
      tipoFactura:nc.tipoFactura, formaPago:nc.formaPago, obs:nc.obs,
      items:[...nc.items], total, pagado:0, estado:"pendiente" };
    try {
      const { error:errComp } = await supabase.from("compras").insert({
        id, numero:comp.numero, fecha:comp.fecha, proveedor:comp.proveedor,
        nro_factura:comp.nroFactura||"", tipo_factura:comp.tipoFactura,
        forma_pago:comp.formaPago, obs:comp.obs||"", total, pagado:0, estado:"pendiente"
      });
      if(errComp) { console.error("Error compra:",errComp); alert("Error al guardar: "+errComp.message); return; }
      
      if(nc.items.length>0) {
        const itemsToInsert = nc.items.map(i=>({
          id:gid(), compra_id:id, nombre:i.nombre||"", categoria:i.categoria||"Mercadería", 
          precio:parseFloat(i.precio)||0, qty:parseFloat(i.qty)||1
        }));
        const { error:errItems } = await supabase.from("compra_items").insert(itemsToInsert);
        if(errItems) console.error("Error items:",errItems);
      }
      setCompras(prev=>[comp,...prev]); setNc(emptyNc()); setNcBusqProv(""); setComprasTab("historial");
    } catch(e) { console.error("guardarCompra excepcion:",e); alert("Error inesperado: "+e.message); }
  };

  const registrarPagoProveedor = async () => {
    if(!ppProveedor||!ppMonto) return;
    const id = gid();
    const pago = {id,proveedor:ppProveedor,monto:parseFloat(ppMonto),forma:ppForma,obs:ppObs,nroFactura:ppNroFact,fecha:hoy()};
    await supabase.from("pagos_proveedores").insert({id,proveedor:ppProveedor,monto:parseFloat(ppMonto),forma:ppForma,obs:ppObs,nro_factura:ppNroFact,fecha:hoy()});
    setPagosProveedores(prev=>[pago,...prev]);
    if(ppNroFact) {
      setCompras(prev=>prev.map(c=>{ 
        if(c.nroFactura===ppNroFact){ 
          const np=c.pagado+parseFloat(ppMonto);
          const newEstado = np>=c.total?"pagada":"parcial";
          supabase.from("compras").update({pagado:np,estado:newEstado}).eq("id",c.id).then(()=>{});
          return {...c,pagado:np,estado:newEstado}; 
        } 
        return c; 
      }));
    }
    setPpProveedor(""); setPpMonto(""); setPpObs(""); setPpNroFact("");
  };

  const eliminarCompra = async (id) => {
    if(!window.confirm("¿Eliminar esta compra?")) return;
    await supabase.from("compra_items").delete().eq("compra_id",id);
    await supabase.from("compras").delete().eq("id",id);
    setCompras(prev=>prev.filter(c=>c.id!==id));
  };

  const estadoCuentaProveedores = () => {
    const cuentas = {};
    compras.filter(c=>c.formaPago==="Cuenta corriente").forEach(c=>{
      if(!cuentas[c.proveedor]) cuentas[c.proveedor]={deuda:0,pagado:0,ultimaCompra:c.fecha,facturasMasAntigua:c.fecha};
      cuentas[c.proveedor].deuda+=c.total;
      if(c.fecha>cuentas[c.proveedor].ultimaCompra) cuentas[c.proveedor].ultimaCompra=c.fecha;
      if(c.fecha<cuentas[c.proveedor].facturasMasAntigua) cuentas[c.proveedor].facturasMasAntigua=c.fecha;
    });
    pagosProveedores.forEach(p=>{ if(!cuentas[p.proveedor]) cuentas[p.proveedor]={deuda:0,pagado:0,ultimaCompra:"",facturasMasAntigua:""}; cuentas[p.proveedor].pagado+=p.monto; });
    return Object.entries(cuentas).map(([prov,v])=>({proveedor:prov,deuda:v.deuda,pagado:v.pagado,saldo:v.deuda-v.pagado,ultimaCompra:v.ultimaCompra,diasSinPago:diasDesde(v.facturasMasAntigua)})).filter(x=>x.saldo!==0||x.deuda>0).sort((a,b)=>b.saldo-a.saldo);
  };

  const comprasVencidas = compras.filter(c=>c.formaPago==="Cuenta corriente"&&c.estado!=="pagada"&&diasDesde(c.fecha)>DIAS_ALERTA);
  const estadoCuenta = estadoCuentaProveedores();
  const deudaTotalProveedores = estadoCuenta.reduce((s,x)=>s+(x.saldo>0?x.saldo:0),0);

  // ── PERSONAL ──
  const guardarEmpleado = async () => {
    if(!empForm.nombre) return;
    const id = empEdit||gid();
    const datos = {id,nombre:empForm.nombre,dni:empForm.dni,telefono:empForm.telefono,telefonoAlt:empForm.telefonoAlt,direccion:empForm.direccion,email:empForm.email,rol:empForm.rol,valorHora:parseFloat(empForm.valorHora)||0,fechaIngreso:empForm.fechaIngreso,notas:empForm.notas,categoria:empForm.categoria,activo:true};
    await supabase.from("empleados").upsert({id,nombre:empForm.nombre,dni:empForm.dni,telefono:empForm.telefono,telefono_alt:empForm.telefonoAlt,direccion:empForm.direccion,email:empForm.email,rol:empForm.rol,valor_hora:parseFloat(empForm.valorHora)||0,fecha_ingreso:empForm.fechaIngreso||null,notas:empForm.notas,categoria:empForm.categoria,activo:true},{onConflict:"id"});
    if(empEdit) setEmpleados(prev=>prev.map(e=>e.id===empEdit?datos:e));
    else setEmpleados(prev=>[...prev,datos]);
    setEmpForm({nombre:"",dni:"",telefono:"",telefonoAlt:"",direccion:"",email:"",rol:"Ayudante",valorHora:"",fechaIngreso:"",notas:"",categoria:""}); setEmpEdit(null);
  };

  const eliminarEmpleado = async (id) => {
    if(!window.confirm("¿Eliminar empleado?")) return;
    await supabase.from("empleados").delete().eq("id",id);
    setEmpleados(prev=>prev.filter(e=>e.id!==id));
  };

  const calcularHoras = (entrada, salida) => {
    if(!entrada||!salida) return 0;
    const [eh,em] = entrada.split(":").map(Number);
    const [sh,sm] = salida.split(":").map(Number);
    let mins = (sh*60+sm) - (eh*60+em);
    if(mins < 0) mins += 24*60;
    return Math.round((mins/60)*100)/100;
  };

  const guardarHoras = async () => {
    if(!horaEmpId||!horaEntrada||!horaSalida) return;
    const horas = calcularHoras(horaEntrada, horaSalida);
    const id = gid();
    const reg = {id,empleadoId:horaEmpId,fecha:horaFecha,horas,horaEntrada,horaSalida,turno:horaTurno,obs:horaObs};
    await supabase.from("horas_trabajo").insert({id,empleado_id:horaEmpId,fecha:horaFecha,horas,hora_entrada:horaEntrada,hora_salida:horaSalida,turno:horaTurno,obs:horaObs});
    setHorasTrabajo(prev=>[reg,...prev]); setHoraEntrada(""); setHoraSalida(""); setHoraObs("");
  };

  const editarHoras = async (h) => {
    await supabase.from("horas_trabajo").update({horas:parseFloat(horaEdHoras),obs:horaEdObs}).eq("id",h.id);
    setHorasTrabajo(prev=>prev.map(x=>x.id===h.id?{...x,horas:parseFloat(horaEdHoras),obs:horaEdObs}:x));
    setHoraEdId(null); setHoraEdHoras(""); setHoraEdObs("");
  };

  const eliminarHoras = async (id) => {
    if(!window.confirm("¿Eliminar registro?")) return;
    await supabase.from("horas_trabajo").delete().eq("id",id);
    setHorasTrabajo(prev=>prev.filter(h=>h.id!==id));
  };

  const guardarMovimiento = async () => {
    if(!movEmpId||!movMonto) return;
    const id = gid();
    const mov = {id,empleadoId:movEmpId,tipo:movTipo,monto:parseFloat(movMonto),fecha:movFecha,descripcion:movDesc};
    await supabase.from("movimientos_personal").insert({id,empleado_id:movEmpId,tipo:movTipo,monto:parseFloat(movMonto),fecha:movFecha,descripcion:movDesc});
    setMovimientosPersonal(prev=>[mov,...prev]); setMovMonto(""); setMovDesc("");
  };

  const eliminarMovimiento = async (id) => {
    if(!esAdmin||!window.confirm("¿Eliminar?")) return;
    await supabase.from("movimientos_personal").delete().eq("id",id);
    setMovimientosPersonal(prev=>prev.filter(m=>m.id!==id));
  };

  const guardarPerdida = async () => {
    if(!pTipo||(!pInsumo&&!pProducto&&!pMonto)) return;
    const id = gid();
    const now = new Date().toISOString();
    const reg = {id,fechaHora:now,tipo:pTipo,comanda:pComanda,insumo:pInsumo,producto:pProducto,cantidad:parseFloat(pCantidad)||0,monto:parseFloat(pMonto)||0,costoEstimado:parseFloat(pCosto)||0,descripcion:pDesc,usuario:usuario?.nombre||"",estado:pEstado};
    await supabase.from("perdidas").insert({id,fecha_hora:now,tipo:pTipo,comanda:pComanda,insumo:pInsumo,producto:pProducto,cantidad:parseFloat(pCantidad)||0,monto:parseFloat(pMonto)||0,costo_estimado:parseFloat(pCosto)||0,descripcion:pDesc,usuario:usuario?.nombre||"",estado:pEstado});
    setPerdidas(prev=>[reg,...prev]);
    setPComanda(""); setPInsumo(""); setPProducto(""); setPCantidad(""); setPMonto(""); setPCosto(""); setPDesc(""); setPEstado("Pendiente");
  };

  const eliminarPerdida = async (id) => {
    if(!esAdmin||!window.confirm("¿Eliminar registro?")) return;
    await supabase.from("perdidas").delete().eq("id",id);
    setPerdidas(prev=>prev.filter(p=>p.id!==id));
  };

  const cambiarEstadoPerdida = async (id, estado) => {
    await supabase.from("perdidas").update({estado}).eq("id",id);
    setPerdidas(prev=>prev.map(p=>p.id===id?{...p,estado}:p));
  };

  const perdidasFiltradas = perdidas.filter(p=>{
    if(pfDesde&&p.fechaHora<pfDesde) return false;
    if(pfHasta&&p.fechaHora>pfHasta+"T23:59:59") return false;
    if(pfTipo&&p.tipo!==pfTipo) return false;
    if(pfEstado&&p.estado!==pfEstado) return false;
    return true;
  });
  const totalPerdidas = perdidasFiltradas.reduce((s,p)=>s+(p.costoEstimado||p.monto||0),0);

  // ── PERSONAL HELPERS ──
  const diasSemana = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const ESTADOS_DIA = ["normal","descanso","falta","licencia"];
  const colorEstadoDia = (est) => est==="descanso"?C.info:est==="falta"?C.danger:est==="licencia"?C.warn:C.success;

  const getLunesDeSemana = (offset=0) => {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0=dom,1=lun,...
    const diffLunes = dia===0 ? -6 : 1-dia;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes + offset*7);
    return lunes;
  };

  const getFechasSemana = (offset=0) => {
    const lunes = getLunesDeSemana(offset);
    return Array.from({length:7},(_,i)=>{
      const d = new Date(lunes);
      d.setDate(lunes.getDate()+i);
      return d.toISOString().split("T")[0];
    });
  };

  const fmtFechaConDia = (fechaStr) => {
    if(!fechaStr) return "";
    const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const d = new Date(fechaStr+"T12:00:00");
    return `${dias[d.getDay()]} ${fechaStr.split("-").reverse().join("/")}`;
  };

  const getEstadoDia = (empId, fecha) => estadosDia.find(e=>e.empleadoId===empId&&e.fecha===fecha);

  const setEstadoDiaFn = async (empId, fecha, estado, obs="") => {
    const existing = getEstadoDia(empId, fecha);
    if(existing) {
      await supabase.from("estados_dia").update({estado,obs}).eq("id",existing.id);
      setEstadosDia(prev=>prev.map(e=>e.id===existing.id?{...e,estado,obs}:e));
    } else {
      const id=gid();
      await supabase.from("estados_dia").insert({id,empleado_id:empId,fecha,estado,obs});
      setEstadosDia(prev=>[...prev,{id,empleadoId:empId,fecha,estado,obs}]);
    }
  };

  const marcarSemanaPagada = async (empId, semanaInicio, semanaFin, monto, obs="") => {
    const existing = semanaPersonal.find(s=>s.empleadoId===empId&&s.semanaInicio===semanaInicio);
    const fechaPago = hoy();
    if(existing) {
      await supabase.from("semanas_personal").update({pagado:true,fecha_pago:fechaPago,monto_pagado:monto,obs}).eq("id",existing.id);
      setSemanaPersonal(prev=>prev.map(s=>s.id===existing.id?{...s,pagado:true,fechaPago,montoPagado:monto,obs}:s));
    } else {
      const id=gid();
      await supabase.from("semanas_personal").insert({id,empleado_id:empId,semana_inicio:semanaInicio,semana_fin:semanaFin,pagado:true,fecha_pago:fechaPago,monto_pagado:monto,obs});
      setSemanaPersonal(prev=>[...prev,{id,empleadoId:empId,semanaInicio,semanaFin,pagado:true,fechaPago,montoPagado:monto,obs}]);
    }
  };

  const resumenEmp = (empId,desde,hasta) => {
    const hs = horasTrabajo.filter(h=>h.empleadoId===empId&&(!desde||h.fecha>=desde)&&(!hasta||h.fecha<=hasta));
    const totalH = hs.reduce((s,h)=>s+h.horas,0);
    const emp = empleados.find(e=>e.id===empId);
    const bruto = totalH*(parseFloat(emp?.valorHora)||0);
    const movs = movimientosPersonal.filter(m=>m.empleadoId===empId&&(!desde||m.fecha>=desde)&&(!hasta||m.fecha<=hasta));
    const totalConsumos = movs.filter(m=>m.tipo==="consumo").reduce((s,m)=>s+m.monto,0);
    const totalAdelantos = movs.filter(m=>m.tipo==="adelanto").reduce((s,m)=>s+m.monto,0);
    return {totalH,bruto,totalConsumos,totalAdelantos,neto:bruto-totalConsumos-totalAdelantos};
  };

  // ── INFORMES ──
  const factsFiltro = facturas.filter(f=>{
    if(ifDesde&&f.fecha<ifDesde) return false; if(ifHasta&&f.fecha>ifHasta) return false;
    if(ifVendedor&&f.vendedor!==ifVendedor) return false; if(ifTurno&&f.turno!==ifTurno) return false;
    if(ifTipo&&f.tipoVenta!==ifTipo) return false; return true;
  });
  const totalPeriodo = factsFiltro.reduce((s,f)=>s+f.total,0);
  const prodVentas = {};
  factsFiltro.forEach(f=>f.items.forEach(i=>{ if(!prodVentas[i.nombre]) prodVentas[i.nombre]={qty:0,total:0}; prodVentas[i.nombre].qty+=i.qty; prodVentas[i.nombre].total+=i.precio*i.qty; }));
  const topProds = Object.entries(prodVentas).sort((a,b)=>b[1].qty-a[1].qty).slice(0,10);
  const maxQty = topProds.length>0?topProds[0][1].qty:1;
  const porVendedor = {};
  factsFiltro.forEach(f=>{ if(!porVendedor[f.vendedor]) porVendedor[f.vendedor]={facturas:0,total:0}; porVendedor[f.vendedor].facturas++; porVendedor[f.vendedor].total+=f.total; });
  const topVendedores = Object.entries(porVendedor).sort((a,b)=>b[1].total-a[1].total);
  const maxVenta = topVendedores.length>0?topVendedores[0][1].total:1;
  const colores = [C.accent,"#a78bfa","#34d399","#60a5fa","#f472b6","#fb923c"];

  const facturasCC = facturas.filter(f=>f.medioPago1==="Cuenta Corriente"||f.medioPago2==="Cuenta Corriente");
  const saldoPorCliente = () => {
    const saldos = {};
    // getCC: si la factura quedó con importe en 0, toma el total (antes esas deudas no se sumaban)
    facturasCC.forEach(f=>{ const k=f.clienteId||f.cliente||"Sin cliente"; const n=f.cliente||"Sin cliente"; if(!saldos[k]) saldos[k]={nombre:n,deuda:0,pagado:0,ultCompra:"",ultPago:""}; saldos[k].deuda+=getCC(f); if((f.fecha||"")>saldos[k].ultCompra) saldos[k].ultCompra=f.fecha||""; });
    pagosCC.forEach(p=>{ if(!saldos[p.clienteId]) saldos[p.clienteId]={nombre:p.clienteNombre,deuda:0,pagado:0,ultCompra:"",ultPago:""}; saldos[p.clienteId].pagado+=p.monto; if((p.fecha||"")>saldos[p.clienteId].ultPago) saldos[p.clienteId].ultPago=p.fecha||""; });
    return Object.entries(saldos).map(([k,v])=>({...v,key:k,saldo:v.deuda-v.pagado}));
  };
  const saldosCC = saldoPorCliente();
  const deudaTotalCC = saldosCC.reduce((s,x)=>s+(x.saldo>1?x.saldo:0),0);
  const transferPendientes = facturas.filter(f=>tieneTransfer(f)&&f.transferConfirmada===false);
  // Transferencias sin confirmar de turnos ANTERIORES (desde TRANSF_ALERTA_DESDE)
  const pendAnterioresA = (fecha, turno) => transferPendientes
    .filter(f=>(f.fecha||"")>=TRANSF_ALERTA_DESDE && (!fecha || ordenTurno(f.fecha,f.turno) < ordenTurno(fecha,turno)))
    .sort((a,b)=>ordenTurno(a.fecha,a.turno).localeCompare(ordenTurno(b.fecha,b.turno)));
  const transfPendAnteriores = turnoActivo ? pendAnterioresA(turnoActivo.fecha, turnoActivo.turno) : pendAnterioresA(null,null);
  const transfPendAntesCierre = pendAnterioresA(cierreFecha, cierreTurno);
  // Cartel insistente con la lista y el botón para confirmar cada una
  const avisoTransfPend = (lista, titulo) => lista.length===0 ? null : (
    <div style={{background:"#3b0a0a",border:`2px solid ${C.danger}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{fontWeight:900,color:"#fca5a5",fontSize:15,marginBottom:4}}>🚨 {titulo}: {lista.length} transferencia{lista.length!==1?"s":""} sin confirmar · {fmt(lista.reduce((s,f)=>s+montoTransfer(f),0))}</div>
      <div style={{fontSize:12,color:"#fecaca",marginBottom:8}}>Revisá en el banco o en Mercado Pago que hayan entrado y confirmalas. Este aviso no se va hasta que estén todas confirmadas.</div>
      <div style={{maxHeight:220,overflowY:"auto"}}>
        {lista.map(f=><div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"7px 0",borderTop:"1px solid #7f1d1d",fontSize:13,flexWrap:"wrap"}}>
          <span>{fmtFecha(f.fecha)} · {f.turno} · {f.comanda&&f.comanda!=="—"?"#"+f.comanda+" · ":""}{f.cliente||"Sin cliente"} · <span style={{color:C.muted}}>{f.vendedor}</span></span>
          <span style={{display:"flex",gap:8,alignItems:"center"}}><b style={{color:"#fca5a5"}}>{fmt(montoTransfer(f))}</b><button style={{...css.btn("success"),padding:"5px 10px",fontSize:11}} onClick={()=>confirmarTransfer(f.id)}>✅ Confirmar</button></span>
        </div>)}
      </div>
    </div>);
  const transferConfirmadas = facturas.filter(f=>tieneTransfer(f)&&f.transferConfirmada===true);

  // Filtros CAMBIO 4 (historial)
  const ff = facturas.filter(f=>{
    if(bFact&&![f.numero,f.comanda,f.vendedor,f.cliente,f.turno,f.tipoVenta].join(" ").toLowerCase().includes(bFact.toLowerCase())) return false;
    if(hfComanda&&f.comanda!=="—"&&!String(f.comanda).includes(hfComanda)) return false;
    if(hfDesde&&f.fecha<hfDesde) return false;
    if(hfHasta&&f.fecha>hfHasta) return false;
    if(hfTurno&&f.turno!==hfTurno) return false;
    return true;
  });
  // Filtros CAMBIO 2 (transferencias)
  const transfPendFilt = transferPendientes.filter(f=>(!trDesde||f.fecha>=trDesde)&&(!trHasta||f.fecha<=trHasta));
  const transfConfFilt = transferConfirmadas.filter(f=>(!trDesde||f.fecha>=trDesde)&&(!trHasta||f.fecha<=trHasta));
  // Filtros CAMBIO 1 (cierres)
  const cierresFilt = cierres.filter(c=>(!ccFDesde||c.fecha>=ccFDesde)&&(!ccFHasta||c.fecha<=ccFHasta))
    .sort((a,b)=>((b.fecha||"")+(b.turno==="Noche"?"2":"1")).localeCompare((a.fecha||"")+(a.turno==="Noche"?"2":"1")));
  // Filtro personal
  const movsVista = movimientosPersonal.filter(m=>(!filtEmp||m.empleadoId===filtEmp)&&(!filtTipoMov||m.tipo===filtTipoMov)&&(!filtMovDesde||m.fecha>=filtMovDesde)&&(!filtMovHasta||m.fecha<=filtMovHasta));
  const pf = productos.filter(p=>p.nombre.toLowerCase().includes(bProd.toLowerCase()));
  const cf = clientes.filter(c=>(c.nombre+" "+c.apellido).toLowerCase().includes(bCli.toLowerCase()));
  const comprasFiltradas = compras.filter(c=>[c.numero,c.proveedor,c.nroFactura,c.tipoFactura].join(" ").toLowerCase().includes(bCompras.toLowerCase()));

  // ── NAV ──
  const navs = usuario?.rol==="compras" ? [
    {k:"personal",l:"👤 Personal"},
    {k:"compras",l:"📦 Compras",badge:comprasVencidas.length},
    {k:"perdidas",l:"📉 Pérdidas"},
  ] : [
    ...(esVentas?[{k:"nueva",l:"📄 Nueva Factura"},{k:"historial",l:"🗂 Historial"},{k:"transferencias",l:"🔄 Transferencias",badge:transferPendientes.length},{k:"caja",l:"💰 Cierre de Caja"},{k:"cuentacorriente",l:"🏦 Cta. Corriente",badge:saldosCC.filter(x=>x.saldo>0).length}]:[]),
    ...(esAdmin?[{k:"informes",l:"📊 Informes"}]:[]),
    ...(esVentas?[{k:"productos",l:"🛍 Productos"},{k:"clientes",l:"👥 Clientes"}]:[]),
    ...(esCompras||esAdmin?[{k:"compras",l:"📦 Compras",badge:comprasVencidas.length}]:[]),
    {k:"personal",l:"👤 Personal"},
    ...(esCompras||esAdmin?[{k:"perdidas",l:"📉 Pérdidas"}]:[]),
    ...(esAdmin?[{k:"config",l:"⚙️ Configuración"}]:[]),
  ];

  return (
    <div style={css.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}select option{background:#1f1f1f}input::placeholder,textarea::placeholder{color:#555}
/* ── MOBILE ── */
@media(max-width:600px){
  .fNav{display:none!important}
  .fBnav{display:flex!important}
  .fMain{padding:12px 12px 76px!important}
  .fCard{padding:14px 12px!important}
  .fRow{flex-direction:column!important;gap:8px!important}
  .fRow>*{min-width:0!important;width:100%!important;max-width:100%!important;flex:unset!important}
  .fInput,.fSel{font-size:16px!important;padding:13px 14px!important;height:50px!important}
  .fBtn{min-height:48px!important;font-size:14px!important;padding:12px 18px!important;width:100%}
  .fBtnInline{min-height:48px!important;font-size:14px!important;padding:12px 18px!important}
  .fDropdown{max-height:45vh!important}
  .fDropItem{padding:15px 16px!important;font-size:14px!important;min-height:56px!important;display:flex!important;align-items:center!important;justify-content:space-between!important}
  .fGrid{grid-template-columns:repeat(2,1fr)!important}
  .fTableWrap{overflow-x:auto!important;-webkit-overflow-scrolling:touch}
  .fTotal{text-align:center!important}
  .fTotalNum{font-size:32px!important}
  .fHeader{padding:10px 14px!important}
  .fLogo{font-size:18px!important}
  .fAlerts{flex-wrap:wrap!important;gap:6px!important}
  .fQCats{display:flex!important}
  .fHideM{display:none!important}
  .fStat{padding:14px 12px!important}
}
@media(min-width:601px){
  .fBnav{display:none!important}
  .fQCats{display:none!important}
}
.fBnav{position:fixed;bottom:0;left:0;right:0;background:#111;border-top:2px solid #f97316;display:none;z-index:200;padding-bottom:env(safe-area-inset-bottom,0px)}
.fBnavInner{display:flex;justify-content:space-around;align-items:stretch;width:100%}
.fBnavBtn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:7px 2px;border:none;background:transparent;cursor:pointer;color:#737373;font-size:8px;font-weight:700;font-family:'Sora',sans-serif;letter-spacing:.3px;text-transform:uppercase;gap:2px;min-height:54px;position:relative}
.fBnavBtn.active{color:#f97316}
.fBnavIcon{font-size:20px;line-height:1}
.fBnavBadge{position:absolute;top:5px;right:calc(50% - 20px);background:#ef4444;color:#fff;border-radius:999px;font-size:9px;font-weight:800;padding:1px 5px;line-height:1.2}
.fQCats{display:none;gap:8px;padding:6px 0 2px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;flex-shrink:0}
.fQCats::-webkit-scrollbar{display:none}
@media (hover:hover){.fDropHover:hover{background:#2a2a2a}}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #f97316;outline-offset:1px}
.fQCat{flex-shrink:0;padding:8px 14px;border-radius:999px;border:none;background:#252525;color:#737373;font-size:13px;font-weight:700;cursor:pointer;font-family:'Sora',sans-serif;white-space:nowrap;min-height:38px}
.fQCat.active{background:#f97316;color:#fff}
`}</style>

      {mostrarRecibo&&reciboEmp&&<Recibo emp={reciboEmp} horas={horasTrabajo} movimientos={movimientosPersonal} desde={reciboDesde} hasta={reciboHasta} onClose={()=>setMostrarRecibo(false)}/>}

      {editando&&(
        <div style={css.modal} onClick={e=>{if(e.target===e.currentTarget)setEditando(null);}}>
          <div style={css.modalBox}>
            <div style={{fontSize:16,fontWeight:800,color:C.accent,marginBottom:16}}>✏️ Editar {editando.numero}</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Fecha</div><input style={css.input} type="date" value={editando.fecha} onChange={e=>setEditando(p=>({...p,fecha:e.target.value}))}/></div>
              <div style={css.col}><div style={css.lbl}>Comanda</div><input style={{...css.input,borderColor:C.accent,fontWeight:700}} type="number" value={editando.comanda==="—"?"":editando.comanda} onChange={e=>setEditando(p=>({...p,comanda:e.target.value||"—"}))}/></div>
              <div style={css.col}><div style={css.lbl}>Vendedor</div><select style={css.sel} value={editando.vendedor} onChange={e=>setEditando(p=>({...p,vendedor:e.target.value}))}>{vendedores.map(v=><option key={v}>{v}</option>)}</select></div>
            </div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Turno</div><select style={css.sel} value={editando.turno} onChange={e=>setEditando(p=>({...p,turno:e.target.value}))}>{["Mañana","Noche"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div style={css.col}><div style={css.lbl}>Tipo Venta</div><select style={css.sel} value={editando.tipoVenta} onChange={e=>setEditando(p=>({...p,tipoVenta:e.target.value}))}>{tiposVenta.map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>PRODUCTOS</div>
            <div style={{...css.row,marginBottom:8}}>
              <select style={css.sel} value={editSelProd} onChange={e=>{setEditSelProd(e.target.value);const p=productos.find(x=>x.id===e.target.value);setEditSelPrecio(p?String(p.precio):"");}}><option value="">— Agregar —</option>{prodsActivos.map(p=><option key={p.id} value={p.id}>{p.nombre} — {fmt(p.precio)}</option>)}</select>
              <input style={{...css.input,maxWidth:70}} type="number" min="1" placeholder="Cant." value={editSelQty} onChange={e=>setEditSelQty(e.target.value)}/>
              <input style={{...css.input,maxWidth:130}} type="number" placeholder="Precio" value={editSelPrecio} onChange={e=>setEditSelPrecio(e.target.value)}/>
              <button style={css.btn()} onClick={editAddItem}>+</button>
            </div>
            <table style={{...css.table,marginBottom:12}}>
              <thead><tr><th style={css.th}>Producto</th><th style={css.th}>Precio</th><th style={css.th}>Cant.</th><th style={css.th}>Subtotal</th><th style={css.th}></th></tr></thead>
              <tbody>{editando.items.map(i=><tr key={i.id}><td style={css.td}>{i.nombre}</td><td style={css.td}>{fmt(i.precio)}</td><td style={css.td}>{i.qty}</td><td style={{...css.td,fontWeight:700}}>{fmt(i.precio*i.qty)}</td><td style={css.td}><button style={{...css.btn("danger"),padding:"3px 7px",fontSize:10}} onClick={()=>setEditando(p=>({...p,items:p.items.filter(x=>x.id!==i.id)}))}>✕</button></td></tr>)}</tbody>
            </table>
            <div style={{textAlign:"right",fontSize:16,fontWeight:800,color:C.accent,marginBottom:12}}>Total: {fmt(editando.items.reduce((s,i)=>s+i.precio*i.qty,0))}</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Medio 1</div><select style={css.sel} value={editando.medioPago1} onChange={e=>setEditando(p=>({...p,medioPago1:e.target.value}))}>{mediosPago.map(m=><option key={m}>{m}</option>)}</select></div>
              <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>Importe 1</div><input style={css.input} type="number" value={editando.importe1} onChange={e=>setEditando(p=>({...p,importe1:parseFloat(e.target.value)||0}))}/></div>
              <div style={css.col}><div style={css.lbl}>Medio 2</div><select style={css.sel} value={editando.medioPago2} onChange={e=>setEditando(p=>({...p,medioPago2:e.target.value}))}><option value="">— Ninguno —</option>{mediosPago.map(m=><option key={m}>{m}</option>)}</select></div>
              {editando.medioPago2&&<div style={{...css.col,maxWidth:150}}><div style={css.lbl}>Importe 2</div><input style={css.input} type="number" value={editando.importe2} onChange={e=>setEditando(p=>({...p,importe2:parseFloat(e.target.value)||0}))}/></div>}
            </div>
            <div style={css.col}><div style={css.lbl}>Notas</div><input style={css.input} value={editando.notas} onChange={e=>setEditando(p=>({...p,notas:e.target.value}))}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
              <button style={css.btn("neutral")} onClick={()=>setEditando(null)}>Cancelar</button>
              <button style={css.btn()} onClick={guardarEdicion}>💾 Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      <header style={css.header} className="fHeader">
        <div style={{display:"flex",alignItems:"center",gap:10}}><img src={LOGO_FOODIES} alt="" style={{width:38,height:38,borderRadius:8,display:"block"}}/><div><div style={css.logo} className="fLogo">Foodies LK</div><div style={{fontSize:10,color:C.muted,letterSpacing:"2px",textTransform:"uppercase"}} className="fHideM">Sistema de Gestión</div></div></div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}} className="fAlerts">
          {transferPendientes.length>0&&<div style={{background:"#7c2d12",border:`1px solid ${C.danger}`,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",color:"#fb923c"}} onClick={()=>setTab("transferencias")}>⚠️ {transferPendientes.length} transf.</div>}
          {deudaTotalCC>0&&esVentas&&<div style={{background:"#1e3a5f",border:`1px solid ${C.info}`,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",color:C.info}} onClick={()=>setTab("cuentacorriente")}>🏦 CC: {fmt(deudaTotalCC)}</div>}
          {comprasVencidas.length>0&&esCompras&&<div style={{background:"#7f1d1d",border:`1px solid ${C.danger}`,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",color:C.danger}} onClick={()=>setTab("compras")}>📦 {comprasVencidas.length} vencidas</div>}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{background:C.input,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",fontSize:11,color:esAdmin?C.accent:esCompras?C.info:C.success,fontWeight:700}}>{esAdmin?"👑 Admin":esCompras?"📦 Compras":"👤 "+usuario.nombre}</div>
            <button style={{background:"#2a2a2a",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",fontSize:11,color:C.muted,cursor:"pointer"}} onClick={()=>setUsuario(null)}>Salir</button>
          </div>
        </div>
      </header>

      <nav style={css.nav} className="fNav">{navs.map(t=>(
        <button key={t.k} style={css.nb(tab===t.k)} onClick={()=>setTab(t.k)}>
          {t.l}{t.badge>0&&<span style={{position:"absolute",top:-4,right:-4,background:C.danger,color:"#fff",borderRadius:999,fontSize:9,padding:"1px 5px",fontWeight:800}}>{t.badge}</span>}
        </button>
      ))}</nav>

      {/* ── BOTTOM NAV MOBILE ── */}
      <div className="fBnav">
        <div className="fBnavInner">
          {(navs.length>5?navs.slice(0,4):navs).map(t=>(
            <button key={t.k} className={`fBnavBtn${tab===t.k?" active":""}`} onClick={()=>{setTab(t.k);setMasOpen(false);}}>
              {(t.badge||0)>0&&<span className="fBnavBadge">{t.badge}</span>}
              <span className="fBnavIcon">{t.l.split(" ")[0]}</span>
              <span>{t.l.replace(/[^\w\s]/g,"").trim().substring(0,9)}</span>
            </button>
          ))}
          {navs.length>5&&<button className={`fBnavBtn${(masOpen||navs.slice(4).some(t=>t.k===tab))?" active":""}`} onClick={()=>setMasOpen(o=>!o)}>
            {navs.slice(4).reduce((s,t)=>s+(t.badge||0),0)>0&&<span className="fBnavBadge">{navs.slice(4).reduce((s,t)=>s+(t.badge||0),0)}</span>}
            <span className="fBnavIcon">☰</span><span>Más</span>
          </button>}
        </div>
      </div>
      {masOpen&&<div className="fBnavMas" style={{position:"fixed",inset:0,background:"#000a",zIndex:199}} onClick={()=>setMasOpen(false)}>
        <div style={{position:"absolute",left:0,right:0,bottom:64,background:"#161616",borderTop:`2px solid ${C.accent}`,borderRadius:"16px 16px 0 0",padding:"10px 12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:"70vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          {navs.slice(4).map(t=>(
            <button key={t.k} style={{...css.nb(tab===t.k),width:"100%",justifyContent:"flex-start",padding:"14px 12px",fontSize:14,position:"relative"}} onClick={()=>{setTab(t.k);setMasOpen(false);}}>
              {t.l}{(t.badge||0)>0&&<span style={{marginLeft:6,background:C.danger,color:"#fff",borderRadius:999,fontSize:10,padding:"1px 6px",fontWeight:800}}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>}

      <main style={css.main} className="fMain">
        {esVentas&&<div style={css.grid(120)}>
          <div style={css.stat}><div style={css.statV()}>{facturas.length}</div><div style={css.statL}>Facturas</div></div>
          <div style={css.stat}><div style={css.statV()}>{fmt(facturas.reduce((s,f)=>s+f.total,0))}</div><div style={css.statL}>Total ventas</div></div>
          <div style={css.stat}><div style={css.statV(C.success)}>{fmt(facturas.reduce((s,f)=>s+getEfectivo(f),0))}</div><div style={css.statL}>Efectivo</div></div>
          <div style={css.stat}><div style={css.statV(C.warn)}>{fmt(transferPendientes.reduce((s,f)=>s+montoTransfer(f),0))}</div><div style={css.statL}>Transf. pend.</div></div>
          <div style={css.stat}><div style={css.statV(deudaTotalCC>0?C.info:C.success)}>{fmt(deudaTotalCC)}</div><div style={css.statL}>Deuda CC</div></div>
        </div>}
        {esCompras&&!esVentas&&<div style={css.grid(140)}>
          <div style={css.stat}><div style={css.statV()}>{compras.length}</div><div style={css.statL}>Compras</div></div>
          <div style={css.stat}><div style={css.statV(C.danger)}>{fmt(compras.reduce((s,c)=>s+c.total,0))}</div><div style={css.statL}>Total comprado</div></div>
          <div style={css.stat}><div style={css.statV(C.warn)}>{fmt(deudaTotalProveedores)}</div><div style={css.statL}>Deuda proveedores</div></div>
          <div style={css.stat}><div style={css.statV(C.accent)}>{empleados.filter(e=>e.activo).length}</div><div style={css.statL}>Empleados activos</div></div>
        </div>}

        {/* ══ ALERTAS DE CORRELATIVIDAD (solo admin) ══ */}
        {esAdmin&&alertasCorr.length>0&&<div style={{background:"#2a0f0f",border:`1px solid ${C.danger}`,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontWeight:800,color:C.danger,marginBottom:6}}>🚨 {alertasCorr.length} turno{alertasCorr.length>1?"s":""} abierto{alertasCorr.length>1?"s":""} sin seguir la correlatividad</div>
          {alertasCorr.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.border}`,fontSize:12,flexWrap:"wrap"}}>
            <span><b>{a.vendedor}</b> · {a.turno} {a.fecha} · última #{a.comanda_ultima??"—"} → abrió con <b style={{color:C.danger}}>#{a.comanda_ingresada}</b>{a.diferencia>0?` (faltan ${a.diferencia})`:a.diferencia<0?" (número repetido o hacia atrás)":""}</span>
            <button style={{...css.btn("neutral"),padding:"4px 10px",fontSize:11}} onClick={()=>marcarAlertaVista(a.id)}>✓ Visto</button>
          </div>)}
        </div>}

        {/* ══ MODAL CÓDIGO DE AUTORIZACIÓN (correlatividad) ══ */}
        {modalAutorizacion&&<div style={css.modal}>
          <div style={{...css.modalBox,maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",fontSize:40}}>🔒</div>
            <div style={{textAlign:"center",fontWeight:900,fontSize:17,color:C.danger,marginBottom:4}}>La comanda no sigue la correlatividad</div>
            <div style={{background:"#1a1a0a",border:"1px solid #f59e0b",borderRadius:8,padding:"12px 14px",margin:"12px 0",fontSize:13,lineHeight:1.6}}>
              Última comanda: <b>#{modalAutorizacion.ultima?.num}</b> ({modalAutorizacion.ultima?.turno} {modalAutorizacion.ultima?.fecha})<br/>
              Tendría que seguir: <b>#{modalAutorizacion.ultima?.siguiente}</b>{modalAutorizacion.ultima?.esCopia?" (la copia)":""}<br/>
              Ingresada: <b style={{color:C.danger}}>#{modalAutorizacion.comandaNum}</b>
              {modalAutorizacion.diferencia>0&&<> · faltan <b style={{color:C.danger}}>{modalAutorizacion.diferencia}</b></>}
              {modalAutorizacion.diferencia<0&&<> · <b style={{color:C.danger}}>número repetido o hacia atrás</b></>}
            </div>
            <div style={css.lbl}>Código de autorización del administrador</div>
            <input style={{...css.input,width:"100%",boxSizing:"border-box",textAlign:"center",fontSize:20,letterSpacing:6,fontWeight:700}}
              type="password" inputMode="numeric" maxLength={12} placeholder="••••" value={pinIngresado}
              onChange={e=>{setPinIngresado(e.target.value);setPinError("");}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("pin-ok")?.click();}}} autoFocus/>
            {pinError&&<div style={{color:C.danger,fontSize:12,marginTop:8,fontWeight:700}}>{pinError}</div>}
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button style={{...css.btn("neutral"),flex:1,padding:"12px"}} onClick={()=>{setModalAutorizacion(null);setPinIngresado("");setPinError("");}}>✕ Cancelar</button>
              <button id="pin-ok" style={{...css.btn(),flex:1,padding:"12px",opacity:(!pinIngresado||pinVerificando)?0.4:1}} disabled={!pinIngresado||pinVerificando}
                onClick={async()=>{
                  setPinVerificando(true);
                  const ok = await verificarPin(pinIngresado);
                  setPinVerificando(false);
                  if(ok){ const d=modalAutorizacion; setModalAutorizacion(null); setPinIngresado(""); await iniciarTurno(d, pinIngresado.length>4?"codigo_maestro":"pin_admin"); }
                  else { setPinError("❌ Código incorrecto"); setPinIngresado(""); }
                }}>{pinVerificando?"⏳ Verificando...":"🔓 Autorizar"}</button>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:10,textAlign:"center"}}>Queda registrado y le llega una alerta al administrador.</div>
          </div>
        </div>}

        {/* ══ AVISO AL ABRIR TURNO: transferencias anteriores sin confirmar ══ */}
        {modalTransfAviso&&transfPendAnteriores.length>0&&<div style={css.modal}>
          <div style={{...css.modalBox,maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",fontSize:40}}>🔔</div>
            <div style={{textAlign:"center",fontWeight:900,fontSize:18,color:C.danger,marginBottom:10}}>Hay transferencias de turnos anteriores sin confirmar</div>
            {avisoTransfPend(transfPendAnteriores, "Pendientes")}
            <button style={{...css.btn("neutral"),width:"100%",padding:12}} onClick={()=>setModalTransfAviso(false)}>Entendido, las reviso</button>
          </div>
        </div>}

        {/* ══ MODAL IMPRIMIR FACTURA ══ */}
        {modalImprimir&&<div style={css.modal} onClick={()=>setModalImprimir(null)}>
          <div style={{...css.modalBox,maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:900,fontSize:17,marginBottom:2}}>🖨️ Imprimir factura {modalImprimir.numero}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>{modalImprimir.fecha} · {fmt(modalImprimir.total)} · {(modalImprimir.items||[]).length} producto{(modalImprimir.items||[]).length!==1?"s":""}. Completá los datos del cliente (todo opcional).</div>
            {[["imp-nombre","nombre","Nombre y apellido","text","imp-dni"],["imp-dni","dni","DNI / CUIT","text","imp-dir"],["imp-dir","direccion","Dirección","text","imp-tel"],["imp-tel","telefono","Teléfono","tel",null]].map(([id,k,lbl,type,sig])=>(
              <div key={id} style={{marginBottom:10}}><div style={css.lbl}>{lbl}</div>
                <input id={id} type={type} style={{...css.input,width:"100%",boxSizing:"border-box"}} value={impCli[k]} onChange={e=>setImpCli(p=>({...p,[k]:e.target.value}))} enterKeyHint={sig?"next":"go"}
                  onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault(); if(sig) irA(sig); else imprimirFactura();}}}/>
              </div>))}
            <div style={{display:"flex",gap:8,marginTop:6}}>
              <button style={{...css.btn("neutral"),flex:1,padding:12}} onClick={()=>setModalImprimir(null)}>Cancelar</button>
              <button style={{...css.btn(),flex:2,padding:12}} onClick={imprimirFactura}>🖨️ Imprimir / PDF</button>
            </div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button style={{...css.btn("success"),flex:1,padding:12,background:"#16a34a",opacity:telWhatsApp(impCli.telefono)?1:0.4}} disabled={!telWhatsApp(impCli.telefono)} onClick={enviarWhatsAppImprimir}>💬 Enviar por WhatsApp</button>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:8}}>💬 WhatsApp abre el chat del cliente con el detalle del pedido. Para mandar la factura en PDF, guardala con "Imprimir / PDF" y adjuntala en el chat.</div>
            {!datosLocal.telefono&&esAdmin&&<div style={{fontSize:11,color:C.warn,marginTop:10}}>💡 Cargá el teléfono e Instagram del local en Configuración → Datos del local, para que salgan en la factura.</div>}
          </div>
        </div>}

        {/* ══ NUEVA FACTURA ══ */}
        {tab==="nueva"&&esVentas&&!turnoActivo&&avisoTransfPend(pendAnterioresA(taFecha||hoy(), taTurno), "Turnos anteriores")}
        {tab==="nueva"&&esVentas&&!turnoActivo&&(()=>{
          const ult = ultimaComandaAnterior(taFecha||hoy(), taTurno);
          return <div style={{...css.card,border:`2px solid ${C.accent}`}} className="fCard">
            <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>🕐 Abrir turno</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Estos datos se usan en todas las ventas del turno. La fecha es la de hoy, pero la podés cambiar.</div>
            <div style={css.row} className="fRow">
              <div style={css.col}><div style={css.lbl}>Fecha</div><input id="ta-fecha" style={css.input} className="fInput" type="date" value={taFecha} onChange={e=>setTaFecha(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();irA("ta-turno");}}}/></div>
              <div style={css.col}><div style={css.lbl}>Turno</div><SelRapido id="ta-turno" opciones={["Mañana","Noche"]} valor={taTurno} onChange={setTaTurno} onEnter={()=>irA("ta-vendedor")} placeholder="Mañana / Noche"/></div>
              <div style={css.col}><div style={css.lbl}>Vendedor *</div><SelRapido id="ta-vendedor" opciones={vendedores} valor={taVendedor} onChange={setTaVendedor} onEnter={()=>irA("ta-comanda")} placeholder="Escribí el vendedor..."/></div>
              <div style={css.col}><div style={css.lbl}>🧾 N° primera comanda *</div>
                <input id="ta-comanda" style={{...css.input,borderColor:C.accent,fontWeight:700,fontSize:15}} className="fInput" type="number" inputMode="numeric" enterKeyHint="go" placeholder="Ej: 7978924" value={taComanda} onChange={e=>setTaComanda(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();abrirTurno();}}}/>
                {ult&&<div style={{fontSize:11,color:"#f59e0b",marginTop:4}}>Última comanda: <b>#{ult.num}</b> ({ult.turno} {ult.fecha}, usada {ult.usos} {ult.usos===1?"vez":"veces"}) → sigue la <b>#{ult.siguiente}</b>{ult.esCopia?" (la copia)":""}</div>}
              </div>
            </div>
            <div style={{marginTop:16}}><button style={{...css.btn(),padding:"14px 28px",fontSize:15,width:"100%"}} className="fBtn" onClick={abrirTurno}>✅ Abrir turno</button></div>
          </div>;
        })()}

        {tab==="nueva"&&esVentas&&turnoActivo&&<>
          <div style={{background:"#0f2a0f",border:`1px solid ${C.success}`,borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontWeight:800,color:C.success,fontSize:14}}>🟢 Turno {turnoActivo.turno} · {turnoActivo.fecha}</div>
              <div style={{fontSize:12,color:C.muted}}>Vendedor: <b style={{color:C.text}}>{turnoActivo.vendedor}</b> · Desde {turnoActivo.hora} · Comanda inicial <b style={{color:"#f59e0b"}}>#{turnoActivo.comandaInicial}</b></div>
              {turnoActivo.motivoAutorizacion&&turnoActivo.motivoAutorizacion!=="normal"
                ?<div style={{fontSize:11,color:C.danger,marginTop:2}}>⚠️ Abierto con código: no seguía la correlatividad (última #{turnoActivo.ultimaAnterior})</div>
                :<div style={{fontSize:11,color:C.success,marginTop:2}}>✅ Correlatividad OK</div>}
            </div>
            <button style={{...css.btn("neutral"),padding:"8px 14px",fontSize:12}} onClick={cerrarTurno}>⏹ Cerrar turno</button>
          </div>
          {avisoTransfPend(transfPendAnteriores, "De turnos anteriores")}
          {turnoActivo.inicio&&Date.now()-turnoActivo.inicio>14*60*60*1000&&<div style={{background:"#1a1a0a",border:"1px solid #f59e0b",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
            <div style={{fontWeight:800,color:"#f59e0b",marginBottom:4}}>⚠️ Este turno está abierto desde hace más de 14 horas</div>
            <div style={{fontSize:12,color:C.muted}}>¿Quedó abierto de un día anterior? Cerralo y abrí el turno de hoy.</div>
          </div>}
          {nfOk&&<div style={{background:"#14532d",border:`1px solid ${C.success}`,color:"#dcfce7",borderRadius:10,padding:"12px 14px",marginBottom:10,fontWeight:700,fontSize:14}}>{nfOk}</div>}
          <div style={css.card} className="fCard"><div style={css.cardTitle}>📋 Datos del pedido</div>
            <div style={css.row} className="fRow">
              <div style={css.col}><div style={css.lbl}>Tipo de Venta</div><SelRapido id="nf-tipo" key={`tv-${nfReset}`} opciones={tiposVenta} valor={nf.tipoVenta} onChange={cambiarTipoVenta} onEnter={v=>irA(normTxt(v)==="envio"?"nf-cadete":"nf-cliente")} placeholder="Salón, envío, mostrador..."/></div>
              {nf.tipoVenta==="Envio"&&<div style={css.col}><div style={css.lbl}>Cadete</div><SelRapido id="nf-cadete" key={`ca-${nfReset}`} opciones={cadetes} valor={nf.cadete} onChange={v=>setNf(p=>({...p,cadete:v}))} onEnter={()=>irA("nf-cliente")} placeholder="Escribí el cadete..."/></div>}
              <div ref={nfCliRef} style={css.col}><div style={css.lbl}>Cliente</div>
                <div style={{position:"relative"}}>
                  <input id="nf-cliente" style={{...css.input,width:"100%",boxSizing:"border-box"}} className="fInput"
                    placeholder="Escribí el cliente..." enterKeyHint="next"
                    value={nfCliBusq}
                    onChange={e=>{
                      const v=e.target.value; setNfCliBusq(v); setNfCliOpen(true); setNfCliNew(false); setNfCliIdx(0);
                      setNf(p=>({...p,clienteId:""}));
                    }}
                    onFocus={()=>{ if(nfCliBusq&&!nf.clienteId) setNfCliOpen(true); }}
                    onKeyDown={e=>{
                      const ops = opcionesCliente();
                      if(e.key==="ArrowDown"){ e.preventDefault(); setNfCliOpen(true); setNfCliIdx(i=>Math.min(i+1,Math.max(ops.length-1,0))); }
                      else if(e.key==="ArrowUp"){ e.preventDefault(); setNfCliIdx(i=>Math.max(i-1,0)); }
                      else if(e.key==="Enter"){ e.preventDefault();
                        if(nfCliOpen&&ops[nfCliIdx]) elegirOpcionCliente(ops[nfCliIdx]);
                        else irA("nf-comanda");
                      }
                      else if(e.key==="Escape"){ setNfCliOpen(false); }
                    }}
                    autoComplete="off"
                  />
                  {nf.clienteId&&<span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.success,fontWeight:700,pointerEvents:"none"}}>✓</span>}
                  {nfCliOpen&&nfCliBusq.trim().length>0&&!nfCliNew&&(()=>{
                    const ops = opcionesCliente();
                    return(
                      <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:8,zIndex:500,maxHeight:260,overflowY:"auto",overscrollBehavior:"contain",boxShadow:"0 8px 24px #000a"}}>
                        {ops.map((o,i)=>(
                          <div key={o.nuevo?"__nuevo":o.c.id} className="fDropHover"
                            style={{padding:"12px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:i===nfCliIdx?"#2d2d2d":"transparent",borderLeft:i===nfCliIdx?`3px solid ${C.accent}`:"3px solid transparent"}}
                            onPointerDown={e=>e.preventDefault()}
                            onClick={()=>elegirOpcionCliente(o)}>
                            {o.nuevo
                              ?<span style={{fontWeight:700,fontSize:13,color:C.accent}}>+ Agregar "{nfCliBusq.trim()}" como cliente nuevo</span>
                              :<><span style={{fontWeight:600,fontSize:13}}>{o.c.nombre} {o.c.apellido}</span>{o.c.telefono&&<span style={{fontSize:11,color:C.muted}}>{o.c.telefono}</span>}</>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {nfCliNew&&<div style={{background:"#111",border:`1px solid ${C.accent}`,borderRadius:8,padding:10,marginTop:6}}>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:6}}>➕ Cliente nuevo</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <input id="nf-cli-nom" style={{...css.input,fontSize:14}} placeholder="Nombre *" value={nfCliNewNom} onChange={e=>setNfCliNewNom(e.target.value)} enterKeyHint="next" autoComplete="off"
                      onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();irA("nf-cli-ape");}}}/>
                    <input id="nf-cli-ape" style={{...css.input,fontSize:14}} placeholder="Apellido" value={nfCliNewApe} onChange={e=>setNfCliNewApe(e.target.value)} enterKeyHint="next" autoComplete="off"
                      onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();irA("nf-cli-tel");}}}/>
                    <input id="nf-cli-tel" style={{...css.input,fontSize:14}} placeholder="Teléfono / WhatsApp (ej: 266 4123456)" value={nfCliNewTel} onChange={e=>setNfCliNewTel(e.target.value)} type="tel" inputMode="tel" enterKeyHint="next" autoComplete="off"
                      onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();irA("nf-cli-dir");}}}/>
                    <input id="nf-cli-dir" style={{...css.input,fontSize:14}} placeholder="Dirección" value={nfCliNewDir} onChange={e=>setNfCliNewDir(e.target.value)} enterKeyHint="done" autoComplete="off"
                      onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();guardarClienteNuevo();}}}/>
                    <div style={{display:"flex",gap:6}}>
                      <button style={{...css.btn("neutral"),flex:1}} onClick={()=>{setNfCliNew(false);irA("nf-cliente");}}>Cancelar</button>
                      <button style={{...css.btn(),flex:2}} onClick={guardarClienteNuevo}>✓ Guardar cliente</button>
                    </div>
                  </div>
                </div>}
              </div>
              <div style={{...css.col,maxWidth:160}}><div style={css.lbl}>🧾 N° Comanda</div><input id="nf-comanda" style={{...css.input,maxWidth:160,borderColor:C.accent,fontWeight:700,fontSize:15}} className="fInput" type="number" inputMode="numeric" enterKeyHint="next" placeholder="Ej: 7978924" value={nf.comanda} onChange={e=>setNf(p=>({...p,comanda:e.target.value}))}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();irA("nf-prod");}}}/></div>
            </div>
          </div>
          <div style={css.card} className="fCard"><div style={css.cardTitle}>🛒 Productos</div>
            {/* Quick category chips — solo visibles en mobile */}
            <div className="fQCats">
              {[{l:"🥩 Milanesas",q:"mila"},{l:"🥪 Sándwiches",q:"sand"},{l:"🍕 Pizzas",q:"pizza"},{l:"🥟 Empanadas",q:"empan"},{l:"🍟 Papas",q:"papa"},{l:"🥤 Bebidas",q:"coca"}].map(cat=>(
                <button key={cat.q} className={`fQCat${selBusq===cat.q?" active":""}`}
                  onClick={()=>{if(selBusq===cat.q){setSelBusq("");setSelProd("");setSelPrecio("");setSelOpen(false);}else{setSelBusq(cat.q);setSelProd("");setSelPrecio("");setSelOpen(true);}}}>
                  {cat.l}
                </button>
              ))}
            </div>
            <div style={css.row} className="fRow">
              <div ref={selRef} style={{...css.col,position:"relative"}}><div style={css.lbl}>Buscar producto</div>
                <div style={{position:"relative"}}>
                  <input id="nf-prod" style={{...css.input,width:"100%",boxSizing:"border-box",paddingRight:36}} className="fInput" placeholder="Ej: sand mila, pizza esp, coca..." value={selBusq}
                    onChange={e=>{setSelBusq(e.target.value);setSelProd("");setSelPrecio("");setSelOpen(true);setSelIdx(0);}}
                    onFocus={()=>{ if(selBusq&&!selProd) setSelOpen(true); }}
                    onKeyDown={e=>{
                      const r = (selOpen&&selBusq&&!selProd) ? buscarProductos(selBusq) : [];
                      if(e.key==="ArrowDown"){ e.preventDefault(); if(!selOpen&&selBusq&&!selProd){ setSelOpen(true); return; } setSelIdx(i=>Math.min(i+1,Math.max(r.length-1,0))); }
                      else if(e.key==="ArrowUp"){ e.preventDefault(); setSelIdx(i=>Math.max(i-1,0)); }
                      else if(e.key==="Enter"){ e.preventDefault();
                        if(r[selIdx]) elegirProducto(r[selIdx], true);     // elige el marcado y pasa a la cantidad
                        else if(selProd) irA("nf-qty");
                        else if(!selBusq.trim()) irA("nf-medio1");        // sin producto: pasa al pago
                      }
                      else if(e.key==="Escape") setSelOpen(false);
                    }}
                    autoComplete="off" enterKeyHint="next"/>
                  {selBusq&&<button type="button" aria-label="Borrar búsqueda" style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer",padding:6}}
                    onClick={()=>{setSelBusq("");setSelProd("");setSelPrecio("");setSelOpen(false);}}>✕</button>}
                </div>
                {selOpen&&selBusq.length>0&&selProd===""&&(()=>{
                  const filtrados=buscarProductos(selBusq);
                  return(
                  <div ref={selListRef} style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:8,zIndex:100,maxHeight:"45vh",overflowY:"auto",overscrollBehavior:"contain",WebkitOverflowScrolling:"touch",boxShadow:"0 8px 24px #000b"}} className="fDropdown">
                    {filtrados.length>0&&<div style={{padding:"6px 14px",fontSize:11,color:C.muted,borderBottom:`1px solid ${C.border}`}}>{filtrados.length} producto{filtrados.length!==1?"s":""} · ↑↓ para moverte, Enter para elegir</div>}
                    {filtrados.map((p,i)=>(
                      <div key={p.id} data-idx={i} className="fDropItem fDropHover" style={{padding:"10px 14px",cursor:"pointer",fontSize:13,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:10,background:i===selIdx?"#2d2d2d":"transparent",borderLeft:i===selIdx?`3px solid ${C.accent}`:"3px solid transparent"}}
                        onPointerDown={e=>e.preventDefault()}
                        onClick={()=>elegirProducto(p)}>
                        <span>{p.nombre}</span><span style={{color:C.accent,fontWeight:800,fontSize:14,whiteSpace:"nowrap"}}>{fmt(p.precio)}</span>
                      </div>
                    ))}
                    {filtrados.length===0&&<div style={{padding:"12px 14px",color:C.muted,fontSize:13}}>Sin resultados</div>}
                  </div>);
                })()}
              </div>
              <div style={{...css.col,maxWidth:80}}><div style={css.lbl}>Cant.</div><input id="nf-qty" style={{...css.input,maxWidth:80}} className="fInput" type="number" inputMode="numeric" enterKeyHint="next" min="1" placeholder="1" value={selQty} onChange={e=>setSelQty(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();irA("nf-precio");}}}/></div>
              <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>Precio cobrado</div><input id="nf-precio" style={{...css.input,maxWidth:150}} className="fInput" type="number" inputMode="numeric" enterKeyHint="done" placeholder="Sugerido" value={selPrecio} onChange={e=>setSelPrecio(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault(); if(selProd){ addItem(); } irA("nf-prod");}}}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn()} className="fBtnInline" onClick={()=>{addItem();}}>+ Agregar</button></div>
            </div>
            {nf.items.length>0&&<>
              <div className="fTableWrap"><table style={css.table}><thead><tr><th style={css.th}>Producto</th><th style={css.th} className="fHideM">Precio</th><th style={css.th}>Cant.</th><th style={css.th}>Subtotal</th><th style={css.th}></th></tr></thead>
                <tbody>{nf.items.map(i=><tr key={i.id}><td style={css.td}>{i.nombre}<span className="fHideM"> </span></td><td style={css.td} className="fHideM">{fmt(i.precio)}</td><td style={css.td}>{i.qty}</td><td style={{...css.td,fontWeight:700,color:C.accent}}>{fmt(i.precio*i.qty)}</td><td style={css.td}><button style={{...css.btn("danger"),padding:"6px 10px"}} onClick={()=>setNf(p=>({...p,items:p.items.filter(x=>x.id!==i.id)}))}>✕</button></td></tr>)}</tbody>
              </table></div>
              <div style={css.total} className="fTotal"><div style={{fontSize:10,color:C.muted}}>TOTAL</div><div style={{fontSize:26,fontWeight:800,color:C.accent}} className="fTotalNum">{fmt(totalItems)}</div></div>
            </>}
          </div>
          <div style={css.card} className="fCard"><div style={css.cardTitle}>💳 Medios de Pago</div>
            <div style={css.row} className="fRow">
              <div style={css.col}><div style={css.lbl}>Medio 1</div><SelRapido id="nf-medio1" key={`m1-${nfReset}`} opciones={mediosPago} valor={nf.medioPago1} onChange={v=>setNf(p=>({...p,medioPago1:v}))} onEnter={()=>irA("nf-imp1")} placeholder="Efectivo, transferencia..."/></div>
              <div style={{...css.col,maxWidth:160}}>
                <div style={css.lbl}>Importe 1 {nf.items.length>0&&(!nf.importe1||nf.importe1==="0")&&<span style={{color:C.warn,fontSize:9}}>⚠️ completar</span>}</div>
                <input id="nf-imp1" style={{...css.input,maxWidth:160,borderColor:nf.items.length>0&&(!nf.importe1||nf.importe1==="0")?C.warn:C.border}} className="fInput" type="number" inputMode="numeric" enterKeyHint="next" placeholder={totalItems?String(totalItems):"Monto recibido"} value={nf.importe1} onChange={e=>setNf(p=>({...p,importe1:e.target.value}))}
                  onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault(); if(!nf.importe1&&totalItems) setNf(p=>({...p,importe1:String(totalItems)})); irA("nf-medio2");}}}/>
              </div>
              <div style={css.col}><div style={css.lbl}>Medio 2 (opcional)</div><SelRapido id="nf-medio2" key={`m2-${nfReset}`} opciones={mediosPago} vacio="— Ninguno —" valor={nf.medioPago2} onChange={v=>setNf(p=>({...p,medioPago2:v,importe2:v?p.importe2:""}))} onEnter={v=>irA(v?"nf-imp2":"nf-guardar")} placeholder="— Ninguno —"/></div>
              {nf.medioPago2&&<div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Importe 2</div><input id="nf-imp2" style={{...css.input,maxWidth:160}} className="fInput" type="number" inputMode="numeric" enterKeyHint="done" placeholder="0" value={nf.importe2} onChange={e=>setNf(p=>({...p,importe2:e.target.value}))}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();irA("nf-guardar");}}}/></div>}
            </div>
            {(nf.medioPago1==="Transferencia"||nf.medioPago2==="Transferencia")&&<div style={{background:"#7c3a0e22",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.warn,marginTop:8}}>⚠️ Transferencia pendiente de confirmación</div>}
            {totalItems>0&&<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}>
              <span style={css.tag(C.accent)}>Total: {fmt(totalItems)}</span>
              <span style={css.tag(C.success)}>Pagado: {fmt(totalPagos)}</span>
              <span style={css.tag(dif===0?C.success:dif>0?C.danger:C.warn)}>{dif===0?"✓ Cuadra":dif>0?`Faltan ${fmt(dif)}`:`Exceso ${fmt(-dif)}`}</span>
            </div>}
          </div>
          <div style={css.card} className="fCard"><div style={css.cardTitle}>📝 Notas</div>
            <textarea style={{...css.input,width:"100%",minHeight:60,resize:"vertical"}} placeholder="Observaciones..." value={nf.notas} onChange={e=>setNf(p=>({...p,notas:e.target.value}))}/>
            <div style={{marginTop:14,textAlign:"right"}}><button id="nf-guardar" style={{...css.btn(),padding:"12px 28px",fontSize:14,opacity:(nf.items.length===0)?0.4:1}} className="fBtn" onClick={guardar} disabled={nf.items.length===0}>💾 Guardar Factura (Enter)</button></div>
          </div>
        </>}

        {/* ══ HISTORIAL — CAMBIO 4: filtros múltiples ══ */}
        {tab==="historial"&&esVentas&&<div style={css.card}>
          <div style={css.cardTitle}>🗂 Historial de Comandas</div>
          <div style={{background:"#111",borderRadius:9,padding:12,marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:8,textTransform:"uppercase"}}>🔍 Filtros</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Texto libre</div><input style={css.input} placeholder="Vendedor, cliente..." value={bFact} onChange={e=>setBFact(e.target.value)}/></div>
              <div style={{...css.col,maxWidth:130}}><div style={css.lbl}>N° Comanda</div><input style={css.input} type="number" placeholder="Ej: 42" value={hfComanda} onChange={e=>setHfComanda(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={hfDesde} onChange={e=>setHfDesde(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={hfHasta} onChange={e=>setHfHasta(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Turno</div><select style={css.sel} value={hfTurno} onChange={e=>setHfTurno(e.target.value)}><option value="">— Todos —</option><option>Mañana</option><option>Noche</option></select></div>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,flexWrap:"wrap"}}>
                {turnoActivo&&<button style={css.btn()} onClick={()=>{setBFact("");setHfComanda("");setHfDesde(turnoActivo.fecha);setHfHasta(turnoActivo.fecha);setHfTurno(turnoActivo.turno);}}>🟢 Turno actual</button>}
                <button style={css.btn("neutral")} onClick={()=>{setBFact("");setHfComanda("");setHfDesde("");setHfHasta("");setHfTurno("");}}>Ver todas</button>
              </div>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{ff.length} resultado{ff.length!==1?"s":""} · Mostrando: <b style={{color:C.text}}>{(!hfDesde&&!hfHasta&&!hfTurno)?"todas las facturas":`${hfTurno?"turno "+hfTurno+" · ":""}${hfDesde===hfHasta?fmtFecha(hfDesde):(fmtFecha(hfDesde)+" a "+fmtFecha(hfHasta))}`}</b></div>
          </div>
          {ff.length===0?<p style={{color:C.muted,textAlign:"center",padding:"36px 0"}}>Sin resultados.</p>:
            <div style={{overflowX:"auto"}} className="fTableWrap"><table style={css.table}>
              <thead><tr><th style={css.th}>N°</th><th style={css.th}>Comanda</th><th style={css.th}>Fecha</th><th style={css.th}>Turno</th><th style={css.th}>Tipo</th><th style={css.th}>Vendedor</th><th style={css.th}>Pago</th><th style={css.th}>Transf.</th><th style={css.th}>Total</th><th style={css.th}></th></tr></thead>
              <tbody>{ff.map(f=><tr key={f.id}>
                <td style={{...css.td,color:C.accent,fontWeight:700}}>{f.numero}</td>
                <td style={{...css.td,fontWeight:800,fontSize:15}}>{f.comanda!=="—"?`#${f.comanda}`:"—"}</td>
                <td style={css.td}>{f.fecha}</td><td style={css.td}>{f.turno}</td><td style={css.td}>{f.tipoVenta}</td><td style={css.td}>{f.vendedor}</td>
                <td style={css.td}><span style={css.tag(C.accent)}>{f.medioPago1}</span>{f.medioPago2&&<span style={css.tag(C.info)}>{f.medioPago2}</span>}</td>
                <td style={css.td}>{f.transferConfirmada===null?"—":f.transferConfirmada?<span style={css.tag(C.success)}>✅</span>:<span style={{...css.tag(C.warn),cursor:"pointer"}} onClick={()=>confirmarTransfer(f.id)}>⏳ Confirmar</span>}</td>
                <td style={{...css.td,fontWeight:700}}>{fmt(f.total)}</td>
                <td style={css.td}><div style={{display:"flex",gap:5}}>
                  <button title="Imprimir factura" style={{...css.btn(),padding:"4px 8px",fontSize:10}} onClick={()=>abrirImprimir(f)}>🖨️</button>
                  {(()=>{ const cli=clientes.find(c=>c.id===f.clienteId); return cli&&telWhatsApp(cli.telefono)
                    ? <button title={"WhatsApp a "+cli.nombre} style={{...css.btn("success"),background:"#16a34a",padding:"4px 8px",fontSize:10}} onClick={()=>abrirWhatsApp(cli.telefono, textoComprobante(f, ((cli.nombre||"")+" "+(cli.apellido||"")).trim()))}>💬</button>
                    : null; })()}
                  {esAdmin&&<button style={{...css.btn("warn"),padding:"4px 8px",fontSize:10}} onClick={()=>abrirEdicion(f)}>✏️</button>}
                  {esAdmin&&<button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarFactura(f.id)}>🗑</button>}
                  <span style={{...css.badge(f.estado),cursor:esAdmin?"pointer":"default",padding:"4px 9px"}} onClick={()=>esAdmin&&setFacturas(prev=>prev.map(x=>x.id===f.id?{...x,estado:x.estado==="pagada"?"pendiente":"pagada"}:x))}>{f.estado==="pagada"?"✅":"⏳"}</span>
                </div></td>
              </tr>)}</tbody>
            </table></div>}
        </div>}

        {/* ══ TRANSFERENCIAS — CAMBIO 2 ══ */}
        {tab==="transferencias"&&esVentas&&<>
          <div style={css.card}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10,textTransform:"uppercase"}}>🔍 Filtrar por fecha</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={trDesde} onChange={e=>setTrDesde(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={trHasta} onChange={e=>setTrHasta(e.target.value)}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setTrDesde("");setTrHasta("");}}>✕ Limpiar</button></div>
            </div>
          </div>
          <div style={css.card}>
            <div style={{...css.cardTitle,color:C.warn}}>⏳ Pendientes ({transfPendFilt.length})</div>
            {transfPendFilt.length===0?<p style={{color:C.success,fontWeight:600}}>✅ Sin pendientes en el período.</p>:<>
              <div style={{background:"#7c2d1222",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.warn,marginBottom:12}}>No se cuentan en el cierre hasta confirmarlas.</div>
              <table style={css.table}><thead><tr><th style={css.th}>N°</th><th style={css.th}>Comanda</th><th style={css.th}>Fecha</th><th style={css.th}>Vendedor</th><th style={css.th}>Cliente</th><th style={css.th}>Monto</th><th style={css.th}></th></tr></thead>
                <tbody>{transfPendFilt.map(f=><tr key={f.id} style={{background:"#7c2d1211"}}>
                  <td style={{...css.td,color:C.accent,fontWeight:700}}>{f.numero}</td>
                  <td style={{...css.td,fontWeight:800}}>{f.comanda!=="—"?`#${f.comanda}`:"—"}</td>
                  <td style={css.td}>{f.fecha}</td><td style={css.td}>{f.vendedor}</td><td style={css.td}>{f.cliente||"—"}</td>
                  <td style={{...css.td,fontWeight:700,color:C.warn}}>{fmt(montoTransfer(f))}</td>
                  <td style={css.td}><button style={{...css.btn("success"),padding:"5px 12px",fontSize:11}} onClick={()=>confirmarTransfer(f.id)}>✅ Confirmar</button></td>
                </tr>)}</tbody>
              </table>
              <div style={css.total}><div style={{fontSize:11,color:C.muted}}>TOTAL PENDIENTE</div><div style={{fontSize:24,fontWeight:800,color:C.warn}}>{fmt(transfPendFilt.reduce((s,f)=>s+montoTransfer(f),0))}</div></div>
            </>}
          </div>
          {transfConfFilt.length>0&&<div style={css.card}>
            <div style={{...css.cardTitle,color:C.success}}>✅ Confirmadas ({transfConfFilt.length})</div>
            <table style={css.table}><thead><tr><th style={css.th}>N°</th><th style={css.th}>Comanda</th><th style={css.th}>Fecha</th><th style={css.th}>Vendedor</th><th style={css.th}>Monto</th></tr></thead>
              <tbody>{transfConfFilt.map(f=><tr key={f.id}><td style={{...css.td,color:C.accent,fontWeight:700}}>{f.numero}</td><td style={{...css.td,fontWeight:800}}>{f.comanda!=="—"?`#${f.comanda}`:"—"}</td><td style={css.td}>{f.fecha}</td><td style={css.td}>{f.vendedor}</td><td style={{...css.td,fontWeight:700,color:C.success}}>{fmt(montoTransfer(f))}</td></tr>)}</tbody>
            </table>
          </div>}
        </>}

        {/* ══ CIERRE DE CAJA — CAMBIO 1 ══ */}
        {tab==="caja"&&esVentas&&<>
          {avisoTransfPend(transfPendAntesCierre, "De turnos anteriores a este cierre")}
          <div style={css.card}><div style={css.cardTitle}>💰 Cierre de Caja</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Fecha</div><input style={css.input} type="date" value={cierreFecha} onChange={e=>setCierreFecha(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Turno</div><select style={css.sel} value={cierreTurno} onChange={e=>setCierreTurno(e.target.value)}>{["Mañana","Noche"].map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div style={{background:"#111",borderRadius:10,padding:14,marginBottom:14}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>📱 Sistema</div>
              <div style={css.grid(150)}>
                <div style={css.stat}><div style={css.statV(C.success)}>{fmt(cierreEf)}</div><div style={css.statL}>Efectivo</div></div>
                <div style={css.stat}><div style={css.statV(C.info)}>{fmt(cierreTrConf)}</div><div style={css.statL}>Transf. confirmadas</div></div>
                <div style={{...css.stat,border:`1px solid ${C.warn}44`}}><div style={css.statV(C.warn)}>{fmt(cierreTrPendMonto)}</div><div style={css.statL}>⚠️ Transf. pendientes</div></div>
                <div style={css.stat}><div style={css.statV("#a78bfa")}>{fmt(cierreCC)}</div><div style={css.statL}>Cta. Corriente</div></div>
                <div style={css.stat}><div style={css.statV()}>{factCierre.length}</div><div style={css.statL}>Facturas</div></div>
              </div>
              {cierreTrPend.length>0&&<><div style={{fontSize:11,color:C.warn,fontWeight:700,marginBottom:8,marginTop:12}}>⚠️ Confirmar antes de cerrar</div>
                <table style={css.table}><thead><tr><th style={css.th}>N°</th><th style={css.th}>Comanda</th><th style={css.th}>Vendedor</th><th style={css.th}>Monto</th><th style={css.th}></th></tr></thead>
                  <tbody>{cierreTrPend.map(f=><tr key={f.id}><td style={{...css.td,color:C.accent,fontWeight:700}}>{f.numero}</td><td style={{...css.td,fontWeight:800}}>{f.comanda!=="—"?`#${f.comanda}`:"—"}</td><td style={css.td}>{f.vendedor}</td><td style={{...css.td,color:C.warn,fontWeight:700}}>{fmt(montoTransfer(f))}</td><td style={css.td}><button style={{...css.btn("success"),padding:"4px 10px",fontSize:11}} onClick={()=>confirmarTransfer(f.id)}>✅</button></td></tr>)}</tbody>
                </table></>}
            </div>
            {/* GASTOS Y RETIROS DEL TURNO */}
            <div style={{background:"#111",borderRadius:10,padding:14,marginBottom:14}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>💸 Gastos y Retiros del turno</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Tipo</div>
                  <select style={css.sel} value={grTipo} onChange={e=>setGrTipo(e.target.value)}>
                    <option>Gasto</option><option>Retiro</option>
                  </select>
                </div>
                <div style={{flex:2}}><div style={css.lbl}>Concepto</div><input style={css.input} placeholder="Ej: compra de hielo, pago de envío..." value={grConcepto} onChange={e=>setGrConcepto(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Monto ($)</div><input style={css.input} type="number" placeholder="0" value={grMonto} onChange={e=>setGrMonto(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn()} onClick={guardarGastoRetiro}>+ Agregar</button></div>
              </div>
              {grTurno.length>0&&<div style={{marginTop:12}}>
                <table style={css.table}>
                  <thead><tr><th style={css.th}>Hora</th><th style={css.th}>Tipo</th><th style={css.th}>Concepto</th><th style={css.th}>Monto</th><th style={css.th}></th></tr></thead>
                  <tbody>{grTurno.map(g=><tr key={g.id}>
                    <td style={css.td}>{g.hora}</td>
                    <td style={css.td}><span style={css.tag(g.tipo==="Gasto"?C.danger:C.warn)}>{g.tipo}</span></td>
                    <td style={css.td}>{g.concepto}</td>
                    <td style={{...css.td,fontWeight:700}}>{fmt(g.monto)}</td>
                    <td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarGastoRetiro(g.id)}>🗑</button></td>
                  </tr>)}</tbody>
                </table>
                <div style={{textAlign:"right",marginTop:8,fontSize:12,color:C.muted}}>
                  Gastos: {fmt(gastosContado)} · Retiros: {fmt(retirosContado)}
                </div>
              </div>}
            </div>
            {/* EFECTIVO CONTADO */}
            <div style={{background:"#111",borderRadius:10,padding:14,marginBottom:14}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>🖐 Lo que contás</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Efectivo físico contado ($)</div><input style={{...css.input,fontSize:16,fontWeight:700}} type="number" placeholder="0" value={cierreEfectivo} onChange={e=>setCierreEfectivo(e.target.value)}/></div>
                <div style={{flex:2}}><div style={css.lbl}>Observaciones</div><input style={css.input} placeholder="Ej: faltaban $500..." value={cierreObs} onChange={e=>setCierreObs(e.target.value)}/></div>
              </div>
            </div>
            {cierreEfectivo!==""&&<div style={{...css.card,border:`2px solid ${difCaja===0?C.success:difCaja>0?C.warn:C.danger}`,marginBottom:14}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:10}}>(Efectivo físico + Gastos + Retiros) vs Ventas en efectivo</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
                <div><div style={css.lbl}>Ef. contado</div><div style={{fontSize:18,fontWeight:700}}>{fmt(efectivoContado)}</div></div>
                <div><div style={css.lbl}>+ Gastos</div><div style={{fontSize:18,fontWeight:700,color:C.danger}}>+ {fmt(gastosContado)}</div></div>
                <div><div style={css.lbl}>+ Retiros</div><div style={{fontSize:18,fontWeight:700,color:C.warn}}>+ {fmt(retirosContado)}</div></div>
                <div><div style={css.lbl}>= Total calculado</div><div style={{fontSize:18,fontWeight:800,color:C.info}}>{fmt(efectivoEsperado)}</div></div>
                <div><div style={css.lbl}>Ventas en efectivo</div><div style={{fontSize:18,fontWeight:700}}>{fmt(cierreEf)}</div></div>
                <div style={{background:difCaja===0?"#14532d":difCaja>0?"#713f12":"#7f1d1d",borderRadius:10,padding:"10px 14px"}}>
                  <div style={css.lbl}>DIFERENCIA</div>
                  <div style={{fontSize:22,fontWeight:800,color:difCaja===0?C.success:difCaja>0?C.warn:C.danger}}>{difCaja===0?"✓ Cuadra":difCaja>0?`+${fmt(difCaja)} sobra`:`${fmt(difCaja)} falta`}</div>
                </div>
              </div>
              <div style={{marginTop:14,textAlign:"right"}}><button style={{...css.btn(),padding:"10px 24px"}} onClick={guardarCierre}>💾 Guardar Cierre</button></div>
            </div>}
          </div>
          {cierres.length>0&&<div style={css.card}>
            <div style={css.cardTitle}>📋 Historial de Cierres</div>
            <div style={{background:"#111",borderRadius:9,padding:10,marginBottom:12}}>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={ccFDesde} onChange={e=>setCcFDesde(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={ccFHasta} onChange={e=>setCcFHasta(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
                  <button style={css.btn("neutral")} onClick={()=>{setCcFDesde("");setCcFHasta("");setCcVerTodos(false);}}>✕</button>
                  <button style={css.btn(ccVerTodos?"primary":"neutral")} onClick={()=>setCcVerTodos(v=>!v)}>{ccVerTodos?"Ver últimos 5":"Ver todos"}</button>
                  <span style={{fontSize:11,color:C.muted,paddingBottom:2}}>{(ccFDesde||ccFHasta||ccVerTodos)?`${cierresFilt.length} cierre${cierresFilt.length!==1?"s":""}`:`Últimos ${Math.min(5,cierresFilt.length)} de ${cierresFilt.length}`}</span>
                </div>
              </div>
            </div>
            {cierresFilt.length===0?<p style={{color:C.muted,textAlign:"center",padding:"20px"}}>Sin cierres en el período.</p>:
            <div style={{overflowX:"auto"}}><table style={css.table}>
              <thead><tr><th style={css.th}>Fecha</th><th style={css.th}>Turno</th><th style={css.th}>Fact.</th><th style={css.th}>Ef. sistema</th><th style={css.th}>Gastos</th><th style={css.th}>Retiros</th><th style={css.th}>Ef. contado</th><th style={css.th}>Diferencia</th><th style={css.th}>Transf. pend.</th><th style={css.th}></th></tr></thead>
              <tbody>{((ccFDesde||ccFHasta||ccVerTodos)?cierresFilt:cierresFilt.slice(0,5)).map(cierre=><tr key={cierre.id}>
                <td style={css.td}>{fmtFecha(cierre.fecha)}</td><td style={css.td}>{cierre.turno}</td><td style={css.td}>{cierre.facturas}</td>
                <td style={css.td}>{fmt(cierre.efectivo)}</td><td style={{...css.td,color:C.danger}}>{fmt(cierre.gastosContado)}</td><td style={{...css.td,color:C.warn}}>{fmt(cierre.retiros||0)}</td><td style={css.td}>{fmt(cierre.efectivoContado)}</td>
                <td style={css.td}><span style={{fontWeight:800,color:cierre.diferencia===0?C.success:cierre.diferencia>0?C.warn:C.danger}}>{cierre.diferencia===0?"✓":cierre.diferencia>0?`+${fmt(cierre.diferencia)}`:fmt(cierre.diferencia)}</span></td>
                <td style={{...css.td,color:cierre.transferPendiente>0?C.warn:C.muted}}>{cierre.transferPendiente>0?fmt(cierre.transferPendiente):"—"}</td>
                <td style={css.td}><div style={{display:"flex",gap:5}}><button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={()=>generarReporteDia(cierre)}>📄 Reporte</button>{esAdmin&&<button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarCierre(cierre.id)}>🗑</button>}</div></td>
              </tr>)}</tbody>
            </table></div>}
          </div>}
          <div style={css.card}>
            <div style={css.cardTitle}>💸 Historial de Gastos y Retiros</div>
            <div style={{background:"#111",borderRadius:9,padding:10,marginBottom:12}}>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Turno</div><select style={css.sel} value={grFiltTurno} onChange={e=>setGrFiltTurno(e.target.value)}><option value="ultimo">Último turno</option><option value="todos">Todos</option><option value="Mañana">Mañana</option><option value="Noche">Noche</option></select></div>
                <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={grFiltDesde} onChange={e=>{setGrFiltDesde(e.target.value); if(grFiltTurno==="ultimo") setGrFiltTurno("todos");}}/></div>
                <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={grFiltHasta} onChange={e=>{setGrFiltHasta(e.target.value); if(grFiltTurno==="ultimo") setGrFiltTurno("todos");}}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setGrFiltDesde("");setGrFiltHasta("");setGrFiltTurno("ultimo");}}>✕</button></div>
              </div>
            </div>
            {(()=>{
              const ordG = g=>(g.fecha||"")+(g.turno==="Noche"?"2":"1");
              const ultimoT = gastosRetiros.reduce((m,g)=>ordG(g)>m?ordG(g):m,"");
              const grf=gastosRetiros.filter(g=>grFiltTurno==="ultimo"
                  ? ordG(g)===ultimoT
                  : (!grFiltDesde||g.fecha>=grFiltDesde)&&(!grFiltHasta||g.fecha<=grFiltHasta)&&(grFiltTurno==="todos"||g.turno===grFiltTurno))
                .sort((a,b)=>ordG(b).localeCompare(ordG(a))||(b.hora||"").localeCompare(a.hora||""));
              const ultG = gastosRetiros.find(g=>ordG(g)===ultimoT);
              const tG=grf.filter(g=>g.tipo==="Gasto").reduce((s,g)=>s+g.monto,0);
              const tR=grf.filter(g=>g.tipo==="Retiro").reduce((s,g)=>s+g.monto,0);
              return <>{grFiltTurno==="ultimo"&&ultG&&<div style={{fontSize:12,color:C.muted,marginBottom:8}}>Mostrando el último turno con registros: <b style={{color:C.text}}>{ultG.turno} · {fmtFecha(ultG.fecha)}</b>. Para ver otros, cambiá el filtro.</div>}
                {grf.length===0?<p style={{color:C.muted,textAlign:"center",padding:"20px"}}>Sin registros en el período.</p>
                :<><div style={css.grid(140)}>
                  <div style={css.stat}><div style={css.statV()}>{grf.length}</div><div style={css.statL}>Registros</div></div>
                  <div style={css.stat}><div style={css.statV(C.danger)}>{fmt(tG)}</div><div style={css.statL}>Total Gastos</div></div>
                  <div style={css.stat}><div style={css.statV(C.warn)}>{fmt(tR)}</div><div style={css.statL}>Total Retiros</div></div>
                </div>
                <div style={{overflowX:"auto",marginTop:12}}><table style={css.table}>
                  <thead><tr><th style={css.th}>Fecha</th><th style={css.th}>Hora</th><th style={css.th}>Turno</th><th style={css.th}>Tipo</th><th style={css.th}>Concepto</th><th style={css.th}>Monto</th>{esAdmin&&<th style={css.th}></th>}</tr></thead>
                  <tbody>{grf.map(g=><tr key={g.id}>
                    <td style={css.td}>{fmtFecha(g.fecha)}</td><td style={css.td}>{g.hora}</td><td style={css.td}><span style={css.tag(C.info)}>{g.turno}</span></td>
                    <td style={css.td}><span style={css.tag(g.tipo==="Gasto"?C.danger:C.warn)}>{g.tipo}</span></td>
                    <td style={css.td}>{g.concepto}</td><td style={{...css.td,fontWeight:700}}>{fmt(g.monto)}</td>
                    {esAdmin&&<td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarGastoRetiro(g.id)}>🗑</button></td>}
                  </tr>)}</tbody>
                </table></div></>}</>;
            })()}
          </div>

        </>}

        {/* ══ CUENTA CORRIENTE ══ */}
        {tab==="cuentacorriente"&&esVentas&&(()=>{
          const deben = saldosCC.filter(x=>x.saldo>1).sort((a,b)=>b.saldo-a.saldo);
          const q = normTxt(ccBusq);
          const consulta = saldosCC.filter(x=>(!q||normTxt(x.nombre).includes(q)) && (ccEstado==="todos"||(ccEstado==="deben"?x.saldo>1:x.saldo<=1))).sort((a,b)=>b.saldo-a.saldo||a.nombre.localeCompare(b.nombre));
          const pagosFilt = pagosCC.filter(p=>(!q||normTxt(p.clienteNombre).includes(q)) && (!ccPDesde||p.fecha>=ccPDesde) && (!ccPHasta||p.fecha<=ccPHasta)).sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
          return <>
          {/* ARRIBA: solo los que deben */}
          <div style={css.card}><div style={css.cardTitle}>🔴 Clientes que deben ({deben.length})</div>
            {deben.length===0?<p style={{color:C.success,textAlign:"center",padding:"24px 0",fontWeight:700}}>✅ Nadie debe. Todas las cuentas están al día.</p>:
              <div style={{overflowX:"auto"}}><table style={css.table}><thead><tr><th style={css.th}>Cliente</th><th style={css.th}>Deuda</th><th style={css.th}>Pagado</th><th style={css.th}>Saldo</th><th style={css.th}>Últ. compra</th><th style={css.th}></th></tr></thead>
                <tbody>{deben.map(x=><tr key={x.key}><td style={{...css.td,fontWeight:600}}>{x.nombre}</td><td style={{...css.td,color:C.danger}}>{fmt(x.deuda)}</td><td style={{...css.td,color:C.success}}>{fmt(x.pagado)}</td><td style={css.td}><span style={{fontWeight:800,fontSize:14,color:C.warn}}>{fmt(x.saldo)}</span></td><td style={{...css.td,color:C.muted}}>{x.ultCompra?fmtFecha(x.ultCompra):"—"}</td>
                  <td style={css.td}><button style={{...css.btn("success"),padding:"5px 10px",fontSize:11}} onClick={()=>{setCcCliente(x.key);setCcMonto(String(Math.round(x.saldo)));irA("cc-monto");}}>💵 Cobrar</button></td></tr>)}</tbody>
              </table></div>}
            {deudaTotalCC>0&&<div style={css.total}><div style={{fontSize:11,color:C.muted}}>DEUDA TOTAL</div><div style={{fontSize:24,fontWeight:800,color:C.warn}}>{fmt(deudaTotalCC)}</div></div>}
          </div>
          <div style={css.card}><div style={css.cardTitle}>💵 Registrar Pago</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Cliente</div><select style={css.sel} value={ccCliente} onChange={e=>{setCcCliente(e.target.value);const x=saldosCC.find(y=>y.key===e.target.value);if(x)setCcMonto(String(Math.round(x.saldo)));}}><option value="">— Seleccionar —</option>{deben.map(x=><option key={x.key} value={x.key}>{x.nombre} — debe {fmt(x.saldo)}</option>)}</select></div>
              <div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Monto ($)</div><input id="cc-monto" style={css.input} type="number" inputMode="numeric" placeholder="0" value={ccMonto} onChange={e=>setCcMonto(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();irA("cc-obs");}}}/></div>
              <div style={css.col}><div style={css.lbl}>Obs.</div><input id="cc-obs" style={css.input} placeholder="Ej: pagó en efectivo" value={ccObs} onChange={e=>setCcObs(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();registrarPagoCC();}}}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("success")} onClick={registrarPagoCC}>✅ Registrar</button></div>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:6}}>Cuando el saldo llega a cero, el cliente sale solo de la lista de arriba.</div>
          </div>
          {/* ABAJO: consulta con filtros */}
          <div style={css.card}><div style={css.cardTitle}>🔍 Consultar cuentas corrientes</div>
            <div style={{background:"#111",borderRadius:9,padding:10,marginBottom:12}}>
              <div style={css.row}>
                <div style={{...css.col,flex:2}}><div style={css.lbl}>Cliente</div><input style={css.input} placeholder="Escribí el nombre..." value={ccBusq} onChange={e=>setCcBusq(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Estado</div><select style={css.sel} value={ccEstado} onChange={e=>setCcEstado(e.target.value)}><option value="todos">Todos</option><option value="deben">Deben</option><option value="aldia">Al día</option></select></div>
                <div style={css.col}><div style={css.lbl}>Pagos desde</div><input style={css.input} type="date" value={ccPDesde} onChange={e=>setCcPDesde(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Pagos hasta</div><input style={css.input} type="date" value={ccPHasta} onChange={e=>setCcPHasta(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setCcBusq("");setCcEstado("todos");setCcPDesde("");setCcPHasta("");}}>✕</button></div>
              </div>
            </div>
            {consulta.length===0?<p style={{color:C.muted,textAlign:"center",padding:"16px"}}>Sin resultados.</p>:
              <div style={{overflowX:"auto"}}><table style={css.table}><thead><tr><th style={css.th}>Cliente</th><th style={css.th}>Deuda</th><th style={css.th}>Pagado</th><th style={css.th}>Saldo</th><th style={css.th}>Últ. compra</th><th style={css.th}>Últ. pago</th></tr></thead>
                <tbody>{consulta.map(x=><tr key={x.key}><td style={{...css.td,fontWeight:600}}>{x.nombre}</td><td style={{...css.td,color:C.danger}}>{fmt(x.deuda)}</td><td style={{...css.td,color:C.success}}>{fmt(x.pagado)}</td><td style={css.td}><span style={{fontWeight:800,fontSize:14,color:x.saldo>1?C.warn:C.success}}>{x.saldo>1?fmt(x.saldo):"✅ Al día"}</span></td><td style={{...css.td,color:C.muted}}>{x.ultCompra?fmtFecha(x.ultCompra):"—"}</td><td style={{...css.td,color:C.muted}}>{x.ultPago?fmtFecha(x.ultPago):"—"}</td></tr>)}</tbody>
              </table></div>}
            <div style={{fontSize:12,fontWeight:700,color:C.muted,margin:"16px 0 8px",textTransform:"uppercase",letterSpacing:"1px"}}>📋 Pagos registrados ({pagosFilt.length})</div>
            {pagosFilt.length===0?<p style={{color:C.muted,textAlign:"center",padding:"12px"}}>Sin pagos en el filtro.</p>:
              <div style={{overflowX:"auto"}}><table style={css.table}><thead><tr><th style={css.th}>Fecha</th><th style={css.th}>Cliente</th><th style={css.th}>Monto</th><th style={css.th}>Obs.</th></tr></thead>
                <tbody>{pagosFilt.map(p=><tr key={p.id}><td style={css.td}>{fmtFecha(p.fecha)}</td><td style={{...css.td,fontWeight:600}}>{p.clienteNombre}</td><td style={{...css.td,fontWeight:700,color:C.success}}>{fmt(p.monto)}</td><td style={{...css.td,color:C.muted}}>{p.obs||"—"}</td></tr>)}</tbody>
              </table></div>}
          </div>
          </>;
        })()}

        {/* ══ INFORMES ══ */}
        {tab==="informes"&&esAdmin&&<>
          <div style={css.card}><div style={css.cardTitle}>🔍 Filtros</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={ifDesde} onChange={e=>setIfDesde(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={ifHasta} onChange={e=>setIfHasta(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Vendedor</div><select style={css.sel} value={ifVendedor} onChange={e=>setIfVendedor(e.target.value)}><option value="">— Todos —</option>{vendedores.map(v=><option key={v}>{v}</option>)}</select></div>
              <div style={css.col}><div style={css.lbl}>Turno</div><select style={css.sel} value={ifTurno} onChange={e=>setIfTurno(e.target.value)}><option value="">— Todos —</option>{["Mañana","Noche"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div style={css.col}><div style={css.lbl}>Tipo</div><select style={css.sel} value={ifTipo} onChange={e=>setIfTipo(e.target.value)}><option value="">— Todos —</option>{tiposVenta.map(t=><option key={t}>{t}</option>)}</select></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setIfDesde("");setIfHasta("");setIfVendedor("");setIfTurno("");setIfTipo("");}}>✕</button></div>
            </div>
          </div>
          {factsFiltro.length===0?<div style={{...css.card,textAlign:"center",padding:"40px",color:C.muted}}>Sin datos.</div>:<>
            <div style={css.grid(140)}>
              <div style={css.stat}><div style={css.statV()}>{factsFiltro.length}</div><div style={css.statL}>Facturas</div></div>
              <div style={css.stat}><div style={css.statV()}>{fmt(totalPeriodo)}</div><div style={css.statL}>Total recaudado</div></div>
              <div style={css.stat}><div style={css.statV()}>{fmt(Math.round(totalPeriodo/(factsFiltro.length||1)))}</div><div style={css.statL}>Ticket promedio</div></div>
              <div style={css.stat}><div style={css.statV(C.info)}>{factsFiltro.filter(f=>f.tipoVenta==="Envio").length}</div><div style={css.statL}>🛵 Envíos</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div style={css.card}><div style={css.cardTitle}>🏆 Top Productos</div>
                {topProds.map(([nombre,data],i)=>(<div key={nombre} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:i===0?C.accent:C.text}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"  "} {nombre}</span><span style={{color:C.muted}}>{data.qty} uds</span></div>
                  <div style={css.bar()}><div style={css.barFill((data.qty/maxQty)*100,colores[i%colores.length])}/></div>
                </div>))}
              </div>
              <div style={css.card}><div style={css.cardTitle}>👤 Por Vendedor</div>
                {topVendedores.map(([nombre,data],i)=>(<div key={nombre} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span>{nombre}</span><span style={{color:C.muted}}>{data.facturas} fact. — {fmt(data.total)}</span></div>
                  <div style={css.bar()}><div style={css.barFill((data.total/maxVenta)*100,colores[i%colores.length])}/></div>
                </div>))}
              </div>
            </div>
          </>}
        </>}

        {/* ══ PRODUCTOS ══ */}
        {tab==="productos"&&esVentas&&<div style={css.card}><div style={css.cardTitle}>🛍 Gestión de Productos</div>
          <div style={{background:"#111",padding:12,borderRadius:9,marginBottom:14}}>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>{pfEdit?"Editando":"Nombre"}</div><input style={css.input} placeholder="Nombre del producto" value={pfNombre} onChange={e=>setPfNombre(e.target.value)}/></div>
              <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>Precio ($)</div><input style={{...css.input,maxWidth:150}} type="number" placeholder="0" value={pfPrecio} onChange={e=>setPfPrecio(e.target.value)}/></div>
              <div style={{display:"flex",gap:6,alignItems:"flex-end"}}>
                <button style={css.btn()} onClick={async()=>{
  if(!pfNombre) return;
  const precio = parseFloat(pfPrecio)||0;
  if(pfEdit){
    const {error:e1} = await supabase.from("productos").update({nombre:pfNombre,precio}).eq("id",pfEdit);
    if(e1){alert("Error: "+e1.message);return;}
    setProductos(prev=>prev.map(p=>p.id===pfEdit?{...p,nombre:pfNombre,precio}:p));
    setPfEdit(null);
  } else {
    const newId=gid();
    const {error:e2} = await supabase.from("productos").insert({id:newId,nombre:pfNombre.trim(),precio,activo:true});
    if(e2){alert("Error: "+e2.message);return;}
    setProductos(prev=>[...prev,{id:newId,nombre:pfNombre.trim(),precio,activo:true}]);
  }
  setPfNombre(""); setPfPrecio("");
}}>{pfEdit?"✓ Guardar":"+ Agregar"}</button>
                {pfEdit&&<button style={css.btn("neutral")} onClick={()=>{setPfEdit(null);setPfNombre("");setPfPrecio("");}}>✕</button>}
              </div>
            </div>
          </div>
          <input style={{...css.input,flex:"none",width:"100%",maxWidth:340,marginBottom:10}} placeholder="🔍 Buscar..." value={bProd} onChange={e=>setBProd(e.target.value)}/>
          <div style={{overflowX:"auto"}}><table style={css.table}>
            <thead><tr><th style={css.th}>Nombre</th><th style={css.th}>Precio</th><th style={css.th}>Estado</th>{esAdmin&&<th style={css.th}>Acciones</th>}</tr></thead>
            <tbody>{pf.map(p=><tr key={p.id} style={{opacity:p.activo?1:0.4}}>
              <td style={css.td}>{p.nombre}</td><td style={{...css.td,fontWeight:700,color:C.accent}}>{fmt(p.precio)}</td>
              <td style={css.td}><span style={css.badge(p.activo?"pagada":"pendiente")}>{p.activo?"Activo":"Inactivo"}</span></td>
              {esAdmin&&<td style={css.td}><div style={{display:"flex",gap:5}}>
                <button style={{...css.btn("warn"),padding:"4px 8px",fontSize:10}} onClick={()=>{setPfEdit(p.id);setPfNombre(p.nombre);setPfPrecio(String(p.precio));}}>✏</button>
                <button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={async()=>{
  const newActivo=!p.activo;
  await supabase.from("productos").update({activo:newActivo}).eq("id",p.id);
  setProductos(prev=>prev.map(x=>x.id===p.id?{...x,activo:newActivo}:x));
}}>{p.activo?"Desact.":"Activar"}</button>
                <button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={async()=>{
  if(window.confirm("¿Eliminar?")){
    await supabase.from("productos").delete().eq("id",p.id);
    setProductos(prev=>prev.filter(x=>x.id!==p.id));
  }
}}>🗑</button>
              </div></td>}
            </tr>)}</tbody>
          </table></div>
        </div>}

        {/* ══ CLIENTES — CAMBIO 3: Supabase ══ */}
        {tab==="clientes"&&esVentas&&<div style={css.card}><div style={css.cardTitle}>👥 Gestión de Clientes</div>
          <div style={{background:"#111",padding:12,borderRadius:9,marginBottom:14}}>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Nombre *</div><input style={css.input} placeholder="Nombre" value={cfN} onChange={e=>setCfN(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Apellido</div><input style={css.input} placeholder="Apellido" value={cfA} onChange={e=>setCfA(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Teléfono</div><input style={css.input} placeholder="Teléfono" value={cfT} onChange={e=>setCfT(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Dirección</div><input style={css.input} placeholder="Dirección" value={cfDir} onChange={e=>setCfDir(e.target.value)}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn()} onClick={async()=>{
                if(!cfN) return;
                const id=gid();
                await supabase.from("clientes").insert({id,nombre:cfN,apellido:cfA||"",telefono:cfT||"",direccion:cfDir||""});
                setClientes(prev=>[...prev,{id,nombre:cfN,apellido:cfA,telefono:cfT,direccion:cfDir}]);
                setCfN("");setCfA("");setCfT("");setCfDir("");
              }}>+ Agregar</button></div>
            </div>
          </div>
          <input style={{...css.input,flex:"none",width:"100%",maxWidth:340,marginBottom:10}} placeholder="🔍 Buscar..." value={bCli} onChange={e=>setBCli(e.target.value)}/>
          <table style={css.table}><thead><tr><th style={css.th}>Nombre</th><th style={css.th}>Apellido</th><th style={css.th}>Teléfono</th><th style={css.th}>Dirección</th>{esAdmin&&<th style={css.th}></th>}</tr></thead>
            <tbody>{cf.map(c=><tr key={c.id}><td style={{...css.td,fontWeight:600}}>{c.nombre}</td><td style={css.td}>{c.apellido||"—"}</td><td style={css.td}>{c.telefono||"—"}</td><td style={css.td}>{c.direccion||"—"}</td>
              {esAdmin&&<td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={async()=>{if(window.confirm("¿Eliminar?")){await supabase.from("clientes").delete().eq("id",c.id);setClientes(prev=>prev.filter(x=>x.id!==c.id));}}}>🗑</button></td>}
            </tr>)}</tbody>
          </table>
        </div>}

        {/* ══ COMPRAS ══ */}
        {tab==="compras"&&(esCompras||esAdmin)&&<>
          {comprasVencidas.length>0&&<div style={{...css.card,border:`1px solid ${C.danger}`,background:"#7f1d1d22",marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:C.danger,marginBottom:8}}>⚠️ {comprasVencidas.length} CC con más de {DIAS_ALERTA} días sin pagar</div>{comprasVencidas.slice(0,5).map(c=><div key={c.id} style={{fontSize:12,color:C.muted,marginBottom:3}}>• {c.proveedor} — {fmt(c.total)} — Fact. {c.nroFactura||"s/n"} — {diasDesde(c.fecha)} días</div>)}</div>}
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {[{k:"nueva",l:"📋 Nueva Compra"},{k:"historial",l:"🗂 Historial"},{k:"pagos",l:"💳 Pagar Proveedor"},{k:"estadocuenta",l:"🏦 Estado de Cuentas"},{k:"informes",l:"📊 Informes Compras"}].map(t=>(
              <button key={t.k} style={{...css.btn(comprasTab===t.k?"primary":"neutral"),fontSize:12}} onClick={()=>setComprasTab(t.k)}>{t.l}</button>
            ))}
          </div>

          {comprasTab==="nueva"&&<>
            <div style={css.card}><div style={css.cardTitle}>📋 Datos de la Factura</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Fecha</div><input style={css.input} type="date" value={nc.fecha} onChange={e=>setNc(p=>({...p,fecha:e.target.value}))}/></div>
                <div style={{...css.col,position:"relative"}}><div style={css.lbl}>Proveedor *</div>
                  <input style={css.input} placeholder="Escribí para buscar..." value={ncBusqProv} onChange={e=>{setNcBusqProv(e.target.value);setNc(p=>({...p,proveedor:""}));}} autoComplete="off"/>
                  {ncBusqProv.length>0&&!nc.proveedor&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:8,zIndex:100,maxHeight:200,overflowY:"auto"}}>
                      {proveedores.filter(p=>p.toLowerCase().includes(ncBusqProv.toLowerCase())).slice(0,8).map(p=>(<div key={p} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${C.border}`}} onClick={()=>{setNc(prev=>({...prev,proveedor:p}));setNcBusqProv(p);}} onMouseEnter={e=>e.target.style.background="#2a2a2a"} onMouseLeave={e=>e.target.style.background="transparent"}>{p}</div>))}
                      {proveedores.filter(p=>p.toLowerCase().includes(ncBusqProv.toLowerCase())).length===0&&(<div style={{padding:"8px 12px",fontSize:12}}><span style={{color:C.muted}}>No existe — </span><span style={{color:C.accent,cursor:"pointer",fontWeight:700}} onClick={async()=>{
  const id=gid();
  await supabase.from("proveedores").insert({id,nombre:ncBusqProv});
  setProveedores(prev=>[...prev,ncBusqProv]);
  setNc(p=>({...p,proveedor:ncBusqProv}));
}}>+ Agregar "{ncBusqProv}"</span></div>)}
                    </div>
                  )}
                </div>
                <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>N° Factura</div><input style={css.input} placeholder="Ej: A-0001" value={nc.nroFactura} onChange={e=>setNc(p=>({...p,nroFactura:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>Tipo</div><select style={css.sel} value={nc.tipoFactura} onChange={e=>setNc(p=>({...p,tipoFactura:e.target.value}))}>{TIPOS_FACTURA_COMPRA.map(t=><option key={t}>{t}</option>)}</select></div>
                <div style={css.col}><div style={css.lbl}>Forma de Pago</div><select style={css.sel} value={nc.formaPago} onChange={e=>setNc(p=>({...p,formaPago:e.target.value}))}>{FORMAS_PAGO_COMPRA.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
            </div>
            <div style={css.card}><div style={css.cardTitle}>📦 Artículos</div>
              <div style={css.row}>
                <div style={{...css.col,position:"relative"}}><div style={css.lbl}>Artículo — escribí para buscar</div>
                  <input style={css.input} placeholder="Ej: carne, coca, sal..." value={ncBusqArt} onChange={e=>{setNcBusqArt(e.target.value);setNcSelArt("");setNcPrecio("");}} autoComplete="off"/>
                  {ncBusqArt.length>0&&!ncSelArt&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:8,zIndex:100,maxHeight:220,overflowY:"auto"}}>
                      {articulosCompra.filter(a=>a.nombre.toLowerCase().includes(ncBusqArt.toLowerCase())).slice(0,10).map(a=>(<div key={a.nombre} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${C.border}`}} onClick={()=>{setNcSelArt(a.nombre);setNcBusqArt(a.nombre);setNcPrecio(a.ultimoPrecio?String(a.ultimoPrecio):"");}} onMouseEnter={e=>e.target.style.background="#2a2a2a"} onMouseLeave={e=>e.target.style.background="transparent"}><span>{a.nombre}</span><span style={{color:C.muted,marginLeft:8,fontSize:10}}>{a.categoria}</span>{a.ultimoPrecio>0&&<span style={{color:C.accent,marginLeft:8,fontWeight:700,fontSize:11}}>Último: {fmt(a.ultimoPrecio)}</span>}</div>))}
                      {articulosCompra.filter(a=>a.nombre.toLowerCase().includes(ncBusqArt.toLowerCase())).length===0&&(<div style={{padding:"8px 12px",fontSize:12}}><span style={{color:C.muted}}>No existe — </span><span style={{color:C.accent,cursor:"pointer",fontWeight:700}} onClick={async()=>{
  const id=gid();
  await supabase.from("articulos_compras").insert({id,nombre:ncBusqArt,categoria:"Mercadería",ultimo_precio:0});
  const na={id,nombre:ncBusqArt,categoria:"Mercadería",ultimoPrecio:0};
  setArticulosCompra(prev=>[...prev,na]);
  setNcSelArt(ncBusqArt);
}}>+ Agregar "{ncBusqArt}"</span></div>)}
                    </div>
                  )}
                </div>
                <div style={{...css.col,maxWidth:90}}><div style={css.lbl}>Cantidad</div><input style={{...css.input,maxWidth:90}} type="number" min="0.01" step="0.01" placeholder="1" value={ncQty} onChange={e=>setNcQty(e.target.value)}/></div>
                <div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Costo unit. ($)</div><input style={{...css.input,maxWidth:160}} type="number" placeholder="0" value={ncPrecio} onChange={e=>setNcPrecio(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn()} onClick={()=>{
                  const a=articulosCompra.find(x=>x.nombre===ncSelArt); if(!a) return;
                  const precio=parseFloat(ncPrecio)||a.ultimoPrecio||0; const qty=parseFloat(ncQty)||1;
                  const ex=nc.items.find(i=>i.nombre===a.nombre);
                  if(ex) setNc(prev=>({...prev,items:prev.items.map(i=>i.nombre===a.nombre?{...i,qty:i.qty+qty,precio}:i)}));
                  else setNc(prev=>({...prev,items:[...prev.items,{id:gid(),nombre:a.nombre,categoria:a.categoria,precio,qty}]}));
                  setArticulosCompra(prev=>prev.map(x=>x.nombre===a.nombre?{...x,ultimoPrecio:precio}:x));
                  supabase.from("articulos_compras").update({ultimo_precio:precio}).eq("nombre",a.nombre).then(()=>{});
                  supabase.from("articulos_compras").update({ultimo_precio:precio}).eq("nombre",a.nombre).then(()=>{});
                  setNcSelArt(""); setNcBusqArt(""); setNcQty(""); setNcPrecio("");
                }}>+ Agregar</button></div>
              </div>
              {nc.items.length>0&&<><table style={css.table}><thead><tr><th style={css.th}>Artículo</th><th style={css.th}>Categoría</th><th style={css.th}>Cant.</th><th style={css.th}>Costo unit.</th><th style={css.th}>Subtotal</th><th style={css.th}></th></tr></thead>
                <tbody>{nc.items.map(i=><tr key={i.id}><td style={css.td}>{i.nombre}</td><td style={css.td}><span style={css.tag(C.info)}>{i.categoria}</span></td><td style={css.td}>{i.qty}</td><td style={css.td}>{fmt(i.precio)}</td><td style={{...css.td,fontWeight:700}}>{fmt(i.precio*i.qty)}</td><td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px"}} onClick={()=>setNc(p=>({...p,items:p.items.filter(x=>x.id!==i.id)}))}>✕</button></td></tr>)}</tbody>
              </table><div style={css.total}><div style={{fontSize:10,color:C.muted}}>TOTAL FACTURA</div><div style={{fontSize:26,fontWeight:800,color:C.accent}}>{fmt(totalNc)}</div></div></>}
            </div>
            <div style={css.card}><div style={css.lbl}>Observaciones</div><textarea style={{...css.input,width:"100%",minHeight:60,resize:"vertical",marginBottom:12}} placeholder="Notas..." value={nc.obs} onChange={e=>setNc(p=>({...p,obs:e.target.value}))}/>
              <div style={{textAlign:"right"}}><button style={{...css.btn(),padding:"10px 28px",fontSize:14,opacity:(!nc.proveedor||nc.items.length===0)?0.4:1}} onClick={guardarCompra} disabled={!nc.proveedor||nc.items.length===0}>💾 Guardar Compra</button></div>
            </div>
          </>}

          {comprasTab==="historial"&&<div style={css.card}><div style={css.cardTitle}>🗂 Historial de Compras</div>
            <input style={{...css.input,flex:"none",width:"100%",maxWidth:360,marginBottom:12}} placeholder="🔍 Buscar..." value={bCompras} onChange={e=>setBCompras(e.target.value)}/>
            {comprasFiltradas.length===0?<p style={{color:C.muted,textAlign:"center",padding:"36px 0"}}>No hay compras.</p>:
              <div style={{overflowX:"auto"}}><table style={css.table}>
                <thead><tr><th style={css.th}>N°</th><th style={css.th}>Fecha</th><th style={css.th}>Proveedor</th><th style={css.th}>N° Fact.</th><th style={css.th}>Tipo</th><th style={css.th}>Pago</th><th style={css.th}>Total</th><th style={css.th}>Estado</th><th style={css.th}>Días</th><th style={css.th}></th></tr></thead>
                <tbody>{comprasFiltradas.map(comp=><tr key={comp.id} style={{background:comprasVencidas.find(x=>x.id===comp.id)?"#7f1d1d22":"transparent"}}>
                  <td style={{...css.td,color:C.accent,fontWeight:700}}>{comp.numero}</td>
                  <td style={css.td}>{comp.fecha}</td>
                  <td style={{...css.td,fontWeight:600}}>{comp.proveedor}</td>
                  <td style={css.td}>{comp.nroFactura||"—"}</td>
                  <td style={css.td}><span style={css.tag(C.info)}>{comp.tipoFactura}</span></td>
                  <td style={css.td}><span style={css.tag(comp.formaPago==="Cuenta corriente"?C.warn:C.success)}>{comp.formaPago}</span></td>
                  <td style={{...css.td,fontWeight:700}}>{fmt(comp.total)}</td>
                  <td style={css.td}>
                    <select style={{...css.sel,minWidth:100,fontSize:11,padding:"4px 6px",background:comp.estado==="pagada"?"#14532d":comp.estado==="parcial"?"#1e3a5f":"#7c2d12",color:"#fff",border:"none"}} value={comp.estado} onChange={async e=>{
                      if(!esAdmin) return;
                      const newEstado=e.target.value;
                      await supabase.from("compras").update({estado:newEstado}).eq("id",comp.id);
                      setCompras(prev=>prev.map(x=>x.id===comp.id?{...x,estado:newEstado}:x));
                    }} disabled={!esAdmin}>
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="parcial">💰 Parcial</option>
                      <option value="pagada">✅ Pagada</option>
                    </select>
                  </td>
                  <td style={{...css.td,color:diasDesde(comp.fecha)>DIAS_ALERTA&&comp.formaPago==="Cuenta corriente"?C.danger:C.muted}}>{diasDesde(comp.fecha)}d</td>
                  <td style={css.td}>{esAdmin&&<button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarCompra(comp.id)}>🗑 Eliminar</button>}</td>
                </tr>)}</tbody>
              </table></div>}
          </div>}

          {comprasTab==="pagos"&&<>
            <div style={css.card}><div style={css.cardTitle}>💳 Registrar Pago a Proveedor</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Proveedor</div><select style={css.sel} value={ppProveedor} onChange={e=>setPpProveedor(e.target.value)}><option value="">— Seleccionar —</option>{estadoCuenta.filter(x=>x.saldo>0).map(x=><option key={x.proveedor} value={x.proveedor}>{x.proveedor} — debe {fmt(x.saldo)}</option>)}{proveedores.filter(p=>!estadoCuenta.find(x=>x.proveedor===p&&x.saldo>0)).map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                <div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Monto ($)</div><input style={css.input} type="number" placeholder="0" value={ppMonto} onChange={e=>setPpMonto(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Forma</div><select style={css.sel} value={ppForma} onChange={e=>setPpForma(e.target.value)}>{FORMAS_PAGO_COMPRA.map(t=><option key={t}>{t}</option>)}</select></div>
                <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>N° Factura</div><input style={css.input} placeholder="A-0001" value={ppNroFact} onChange={e=>setPpNroFact(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Obs.</div><input style={css.input} placeholder="Notas..." value={ppObs} onChange={e=>setPpObs(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("success")} onClick={registrarPagoProveedor}>✅ Registrar</button></div>
              </div>
            </div>
            {pagosProveedores.length>0&&<div style={css.card}><div style={css.cardTitle}>📋 Historial Pagos</div>
              <table style={css.table}><thead><tr><th style={css.th}>Fecha</th><th style={css.th}>Proveedor</th><th style={css.th}>Monto</th><th style={css.th}>Forma</th><th style={css.th}>N° Fact.</th><th style={css.th}>Obs.</th></tr></thead>
                <tbody>{pagosProveedores.map(p=><tr key={p.id}><td style={css.td}>{p.fecha}</td><td style={{...css.td,fontWeight:600}}>{p.proveedor}</td><td style={{...css.td,fontWeight:700,color:C.success}}>{fmt(p.monto)}</td><td style={css.td}>{p.forma}</td><td style={css.td}>{p.nroFactura||"—"}</td><td style={{...css.td,color:C.muted}}>{p.obs||"—"}</td></tr>)}</tbody>
              </table>
            </div>}
          </>}

          {comprasTab==="estadocuenta"&&<div style={css.card}><div style={css.cardTitle}>🏦 Estado de Cuentas por Proveedor</div>
            {estadoCuenta.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px 0"}}>Sin movimientos CC.</p>:
              <table style={css.table}><thead><tr><th style={css.th}>Proveedor</th><th style={css.th}>Total CC</th><th style={css.th}>Pagado</th><th style={css.th}>Saldo</th><th style={css.th}>Días</th></tr></thead>
                <tbody>{estadoCuenta.map(x=><tr key={x.proveedor} style={{background:x.diasSinPago>DIAS_ALERTA&&x.saldo>0?"#7f1d1d22":"transparent"}}>
                  <td style={{...css.td,fontWeight:600}}>{x.proveedor}</td><td style={{...css.td,color:C.danger}}>{fmt(x.deuda)}</td><td style={{...css.td,color:C.success}}>{fmt(x.pagado)}</td>
                  <td style={css.td}><span style={{fontWeight:800,fontSize:14,color:x.saldo>0?(x.diasSinPago>DIAS_ALERTA?C.danger:C.warn):C.success}}>{x.saldo>0?fmt(x.saldo):"✅ Al día"}</span></td>
                  <td style={{...css.td,color:x.diasSinPago>DIAS_ALERTA?C.danger:C.muted}}>{x.saldo>0?`${x.diasSinPago}d`:"—"}</td>
                </tr>)}</tbody>
              </table>}
            {deudaTotalProveedores>0&&<div style={css.total}><div style={{fontSize:11,color:C.muted}}>DEUDA TOTAL</div><div style={{fontSize:24,fontWeight:800,color:C.warn}}>{fmt(deudaTotalProveedores)}</div></div>}
          </div>}

          {comprasTab==="informes"&&<>
            <div style={css.grid(140)}>
              <div style={css.stat}><div style={css.statV(C.danger)}>{fmt(compras.reduce((s,c)=>s+c.total,0))}</div><div style={css.statL}>Total comprado</div></div>
              <div style={css.stat}><div style={css.statV(C.warn)}>{fmt(deudaTotalProveedores)}</div><div style={css.statL}>Deuda proveedores</div></div>
              <div style={css.stat}><div style={css.statV()}>{compras.length}</div><div style={css.statL}>Facturas registradas</div></div>
              <div style={css.stat}><div style={css.statV(comprasVencidas.length>0?C.danger:C.success)}>{comprasVencidas.length}</div><div style={css.statL}>CC vencidas (+{DIAS_ALERTA}d)</div></div>
            </div>
          </>}
        </>}

        {/* ══ PERSONAL — MÓDULO NUEVO ══ */}
        {tab==="personal"&&<>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {[
              {k:"empleados",l:"👤 Empleados"},
              {k:"horas",l:"⏱ Registrar Horas"},
              {k:"movimientos",l:"💸 Adelantos / Consumos"},
              {k:"semana",l:"📅 Vista Semanal"},
              ...(esAdmin?[{k:"resumen",l:"📊 Resumen & Recibos"}]:[]),
            ].map(t=>(<button key={t.k} style={{...css.btn(personalTab===t.k?"primary":"neutral"),fontSize:12}} onClick={()=>setPersonalTab(t.k)}>{t.l}</button>))}
          </div>

          {personalTab==="empleados"&&<>
            {(esAdmin||esCompras)&&<div style={css.card}>
              <div style={css.cardTitle}>{empEdit?"✏️ Editando empleado":"➕ Nuevo Empleado"}</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Nombre completo *</div><input style={css.input} placeholder="Nombre" value={empForm.nombre} onChange={e=>setEmpForm(p=>({...p,nombre:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>DNI</div><input style={css.input} placeholder="DNI" value={empForm.dni} onChange={e=>setEmpForm(p=>({...p,dni:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>Teléfono principal</div><input style={css.input} placeholder="Teléfono" value={empForm.telefono} onChange={e=>setEmpForm(p=>({...p,telefono:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>Teléfono alternativo</div><input style={css.input} placeholder="Otro teléfono" value={empForm.telefonoAlt} onChange={e=>setEmpForm(p=>({...p,telefonoAlt:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>Dirección</div><input style={css.input} placeholder="Dirección" value={empForm.direccion} onChange={e=>setEmpForm(p=>({...p,direccion:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>Email</div><input style={css.input} placeholder="Email (opcional)" value={empForm.email} onChange={e=>setEmpForm(p=>({...p,email:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>Rol / Puesto</div><select style={css.sel} value={empForm.rol} onChange={e=>setEmpForm(p=>({...p,rol:e.target.value}))}>{ROLES_EMPLEADO.map(r=><option key={r}>{r}</option>)}</select></div>
                <div style={css.col}><div style={css.lbl}>Categoría</div><input style={css.input} placeholder="Ej: Tiempo completo" value={empForm.categoria} onChange={e=>setEmpForm(p=>({...p,categoria:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>Fecha de ingreso</div><input style={css.input} type="date" value={empForm.fechaIngreso} onChange={e=>setEmpForm(p=>({...p,fechaIngreso:e.target.value}))}/></div>
                {esAdmin&&<div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Valor hora ($)</div><input style={css.input} type="number" placeholder="0" value={empForm.valorHora} onChange={e=>setEmpForm(p=>({...p,valorHora:e.target.value}))}/></div>}
              </div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Notas / Observaciones</div><input style={css.input} placeholder="Información adicional del empleado" value={empForm.notas} onChange={e=>setEmpForm(p=>({...p,notas:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                {empEdit&&<button style={css.btn("neutral")} onClick={()=>{setEmpEdit(null);setEmpForm({nombre:"",dni:"",telefono:"",telefonoAlt:"",direccion:"",email:"",rol:"Ayudante",valorHora:"",fechaIngreso:"",notas:"",categoria:""});}}>Cancelar</button>}
                <button style={css.btn()} onClick={guardarEmpleado}>💾 {empEdit?"Guardar cambios":"Agregar empleado"}</button>
              </div>
            </div>}
            <div style={css.card}><div style={css.cardTitle}>👥 Listado de Empleados ({empleados.length})</div>
              {empleados.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px"}}>No hay empleados cargados.</p>:
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr><th style={css.th}>Nombre</th><th style={css.th}>DNI</th><th style={css.th}>Rol</th><th style={css.th}>Teléfono</th><th style={css.th}>Tel. Alt.</th><th style={css.th}>Ingreso</th>{esAdmin&&<th style={css.th}>Valor/h</th>}<th style={css.th}>Acciones</th></tr></thead>
                  <tbody>{empleados.map(e=><tr key={e.id}>
                    <td style={{...css.td,fontWeight:600}}>{e.nombre}</td>
                    <td style={css.td}>{e.dni||"—"}</td>
                    <td style={css.td}><span style={css.tag(C.info)}>{e.rol}</span></td>
                    <td style={css.td}>{e.telefono||"—"}</td>
                    <td style={css.td}>{e.telefonoAlt||"—"}</td>
                    <td style={css.td}>{e.fechaIngreso||"—"}</td>
                    {esAdmin&&<td style={{...css.td,fontWeight:700,color:C.accent}}>{e.valorHora>0?fmt(e.valorHora):"—"}</td>}
                    <td style={css.td}><div style={{display:"flex",gap:5}}>
                      {(esAdmin||esCompras)&&<button style={{...css.btn("warn"),padding:"4px 8px",fontSize:10}} onClick={()=>{setEmpEdit(e.id);setEmpForm({nombre:e.nombre,dni:e.dni,telefono:e.telefono,telefonoAlt:e.telefonoAlt||"",direccion:e.direccion,email:e.email,rol:e.rol,valorHora:String(e.valorHora),fechaIngreso:e.fechaIngreso||"",notas:e.notas||"",categoria:e.categoria||""});setPersonalTab("empleados");}}>✏️</button>}
                      {esAdmin&&<button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarEmpleado(e.id)}>🗑</button>}
                      {esAdmin&&<button style={{...css.btn("info"),padding:"4px 8px",fontSize:10}} onClick={()=>{setReciboEmp(e);setReciboDesde("");setReciboHasta("");setMostrarRecibo(true);}}>🧾</button>}
                    </div></td>
                  </tr>)}</tbody>
                </table></div>}
            </div>
          </>}

          {personalTab==="horas"&&<>
            <div style={css.card}><div style={css.cardTitle}>⏱ Registrar Turno</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Empleado *</div><select style={css.sel} value={horaEmpId} onChange={e=>setHoraEmpId(e.target.value)}><option value="">— Seleccionar —</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} ({e.rol})</option>)}</select></div>
                <div style={css.col}><div style={css.lbl}>Fecha</div><input style={css.input} type="date" value={horaFecha} onChange={e=>setHoraFecha(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Turno</div><select style={css.sel} value={horaTurno} onChange={e=>setHoraTurno(e.target.value)}><option>Mañana</option><option>Tarde</option><option>Noche</option></select></div>
                <div style={{...css.col,maxWidth:130}}><div style={css.lbl}>Hora entrada *</div><input style={{...css.input,maxWidth:130}} type="time" value={horaEntrada} onChange={e=>setHoraEntrada(e.target.value)}/></div>
                <div style={{...css.col,maxWidth:130}}><div style={css.lbl}>Hora salida *</div><input style={{...css.input,maxWidth:130}} type="time" value={horaSalida} onChange={e=>setHoraSalida(e.target.value)}/></div>
                {horaEntrada&&horaSalida&&<div style={{...css.col,maxWidth:120}}><div style={css.lbl}>Total calculado</div><div style={{padding:"8px 11px",borderRadius:7,background:"#1a1a1a",fontWeight:800,color:C.accent,fontSize:14}}>{calcularHoras(horaEntrada,horaSalida)}hs</div></div>}
                <div style={css.col}><div style={css.lbl}>Observaciones</div><input style={css.input} placeholder="Opcional" value={horaObs} onChange={e=>setHoraObs(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={{...css.btn(),opacity:(!horaEmpId||!horaEntrada||!horaSalida)?0.4:1}} onClick={guardarHoras} disabled={!horaEmpId||!horaEntrada||!horaSalida}>✅ Registrar</button></div>
              </div>
            </div>
            <div style={css.card}><div style={css.cardTitle}>📋 Historial de Turnos</div>
              {horasTrabajo.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px"}}>Sin registros.</p>:
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr><th style={css.th}>Empleado</th><th style={css.th}>Fecha</th><th style={css.th}>Turno</th><th style={css.th}>Entrada</th><th style={css.th}>Salida</th><th style={css.th}>Horas</th><th style={css.th}>Subtotal</th><th style={css.th}>Obs.</th>{esAdmin&&<th style={css.th}></th>}</tr></thead>
                  <tbody>{horasTrabajo.slice(0,60).map(h=>{
                    const emp=empleados.find(e=>e.id===h.empleadoId);
                    return <tr key={h.id}>
                      <td style={{...css.td,fontWeight:600}}>{emp?.nombre||"—"}</td>
                      <td style={css.td}>{h.fecha}</td>
                      <td style={css.td}><span style={css.tag(C.info)}>{h.turno||"—"}</span></td>
                      <td style={{...css.td,color:C.success,fontWeight:700}}>{h.horaEntrada||"—"}</td>
                      <td style={{...css.td,color:C.danger,fontWeight:700}}>{h.horaSalida||"—"}</td>
                      <td style={css.td}><span style={{fontWeight:800,color:C.accent}}>{h.horas}hs</span></td>
                      <td style={css.td}>{emp&&emp.valorHora>0?<span style={{color:C.muted,fontSize:11}}>{fmt(h.horas*emp.valorHora)}</span>:"—"}</td>
                      <td style={{...css.td,color:C.muted}}>{h.obs||"—"}</td>
                      {esAdmin&&<td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarHoras(h.id)}>🗑</button></td>}
                    </tr>;
                  })}</tbody>
                </table></div>}
            </div>
          </>}

          {personalTab==="movimientos"&&<>
            <div style={css.card}><div style={css.cardTitle}>💸 Registrar Adelanto o Consumo</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Empleado</div><select style={css.sel} value={movEmpId} onChange={e=>setMovEmpId(e.target.value)}><option value="">— Seleccionar —</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
                <div style={css.col}><div style={css.lbl}>Tipo</div><select style={css.sel} value={movTipo} onChange={e=>setMovTipo(e.target.value)}><option value="adelanto">💰 Adelanto</option><option value="consumo">🛒 Consumo</option></select></div>
                <div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Monto ($)</div><input style={css.input} type="number" placeholder="0" value={movMonto} onChange={e=>setMovMonto(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Fecha</div><input style={css.input} type="date" value={movFecha} onChange={e=>setMovFecha(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Descripción</div><input style={css.input} placeholder="Ej: efectivo, galletitas..." value={movDesc} onChange={e=>setMovDesc(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn()} onClick={guardarMovimiento}>✅ Registrar</button></div>
              </div>
            </div>
            {esAdmin&&<div style={css.card}><div style={css.cardTitle}>🔍 Filtros</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Empleado</div><select style={css.sel} value={filtEmp} onChange={e=>setFiltEmp(e.target.value)}><option value="">— Todos —</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
                <div style={css.col}><div style={css.lbl}>Tipo</div><select style={css.sel} value={filtTipoMov} onChange={e=>setFiltTipoMov(e.target.value)}><option value="">— Todos —</option><option value="adelanto">Adelanto</option><option value="consumo">Consumo</option></select></div>
                <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={filtMovDesde} onChange={e=>setFiltMovDesde(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={filtMovHasta} onChange={e=>setFiltMovHasta(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setFiltEmp("");setFiltTipoMov("");setFiltMovDesde("");setFiltMovHasta("");}}>✕</button></div>
              </div>
            </div>}
            <div style={css.card}><div style={css.cardTitle}>📋 Historial de Movimientos</div>
              {movsVista.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px"}}>Sin movimientos.</p>:
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr><th style={css.th}>Empleado</th><th style={css.th}>Tipo</th><th style={css.th}>Monto</th><th style={css.th}>Fecha</th><th style={css.th}>Descripción</th>{esAdmin&&<th style={css.th}></th>}</tr></thead>
                  <tbody>{movsVista.map(m=>{
                    const emp=empleados.find(e=>e.id===m.empleadoId);
                    return <tr key={m.id}>
                      <td style={{...css.td,fontWeight:600}}>{emp?.nombre||"—"}</td>
                      <td style={css.td}><span style={css.tag(m.tipo==="adelanto"?C.warn:C.info)}>{m.tipo==="adelanto"?"💰 Adelanto":"🛒 Consumo"}</span></td>
                      <td style={{...css.td,fontWeight:700,color:C.danger}}>- {fmt(m.monto)}</td>
                      <td style={css.td}>{m.fecha}</td>
                      <td style={{...css.td,color:C.muted}}>{m.descripcion||"—"}</td>
                      {esAdmin&&<td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarMovimiento(m.id)}>🗑</button></td>}
                    </tr>;
                  })}</tbody>
                </table></div>}
            </div>
          </>}

          {personalTab==="semana"&&<>
            {/* Navegación de semana */}
            <div style={css.card}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <button style={css.btn("neutral")} onClick={()=>setSemanaOffset(p=>p-1)}>← Anterior</button>
                <button style={{...css.btn("neutral"),opacity:semanaOffset===0?0.4:1}} onClick={()=>setSemanaOffset(0)} disabled={semanaOffset===0}>Semana actual</button>
                <button style={css.btn("neutral")} onClick={()=>setSemanaOffset(p=>p+1)}>Siguiente →</button>
                <div style={{flex:1,textAlign:"center",fontWeight:800,color:C.accent,fontSize:14}}>
                  {(()=>{const fs=getFechasSemana(semanaOffset);return `${fs[0].split("-").reverse().join("/")} — ${fs[6].split("-").reverse().join("/")}`;})()}
                </div>
                <div style={{...css.col,maxWidth:200}}>
                  <select style={css.sel} value={filtEmpSemana} onChange={e=>setFiltEmpSemana(e.target.value)}>
                    <option value="">— Todos los empleados —</option>
                    {empleados.filter(e=>e.activo).map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Vista semanal por empleado */}
            {empleados.filter(e=>e.activo&&(!filtEmpSemana||e.id===filtEmpSemana)).map(emp=>{
              const fechas = getFechasSemana(semanaOffset);
              const semInicio = fechas[0]; const semFin = fechas[6];
              const semPago = semanaPersonal.find(s=>s.empleadoId===emp.id&&s.semanaInicio===semInicio);
              const horasSem = horasTrabajo.filter(h=>h.empleadoId===emp.id&&h.fecha>=semInicio&&h.fecha<=semFin);
              const totalHsSem = horasSem.reduce((s,h)=>s+h.horas,0);
              const brutoSem = totalHsSem*(parseFloat(emp.valorHora)||0);
              const movsSem = movimientosPersonal.filter(m=>m.empleadoId===emp.id&&m.fecha>=semInicio&&m.fecha<=semFin);
              const adelantosSem = movsSem.filter(m=>m.tipo==="adelanto").reduce((s,m)=>s+m.monto,0);
              const consumosSem = movsSem.filter(m=>m.tipo==="consumo").reduce((s,m)=>s+m.monto,0);
              const netoSem = brutoSem - adelantosSem - consumosSem;

              return <div key={emp.id} style={css.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:15,color:C.accent}}>{emp.nombre}</div>
                    <div style={{fontSize:11,color:C.muted}}>{emp.rol} {emp.valorHora>0?`— ${fmt(emp.valorHora)}/h`:""}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:C.muted}}>Horas: <b style={{color:C.accent}}>{totalHsSem}hs</b> | Bruto: <b style={{color:C.success}}>{fmt(brutoSem)}</b> | Neto: <b style={{color:C.warn}}>{fmt(netoSem)}</b></div>
                    </div>
                    {esAdmin&&(semPago?.pagado
                      ?<span style={{...css.tag(C.success),fontSize:11}}>✅ Pagado {semPago.fechaPago?.split("-").reverse().join("/")}</span>
                      :<button style={{...css.btn("success"),fontSize:11,padding:"5px 10px"}} onClick={async()=>{
                        const obs = window.prompt(`Pago semana ${semInicio} — ${emp.nombre}
Monto neto calculado: ${fmt(netoSem)}

Ingresá observación (opcional):`, "");
                        if(obs===null) return;
                        await marcarSemanaPagada(emp.id, semInicio, semFin, netoSem, obs);
                      }}>💰 Marcar Pagado</button>
                    )}
                  </div>
                </div>

                {/* Días de la semana */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                  {fechas.map((fecha,idx)=>{
                    const estadoObj = getEstadoDia(emp.id, fecha);
                    const estado = estadoObj?.estado||"normal";
                    const horasDia = horasTrabajo.filter(h=>h.empleadoId===emp.id&&h.fecha===fecha);
                    const totalHDia = horasDia.reduce((s,h)=>s+h.horas,0);
                    const esFuturo = fecha > new Date().toISOString().split("T")[0];
                    return <div key={fecha} style={{background:"#1a1a1a",borderRadius:8,padding:"8px 6px",border:`1px solid ${estado==="normal"&&totalHDia===0?"#333":colorEstadoDia(estado)}`,textAlign:"center",opacity:esFuturo?0.5:1}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:3}}>{diasSemana[idx]}</div>
                      <div style={{fontSize:10,color:"#888",marginBottom:4}}>{fecha.split("-").slice(1).reverse().join("/")}</div>
                      {totalHDia>0&&<div style={{fontSize:12,fontWeight:800,color:C.accent,marginBottom:3}}>{totalHDia}hs</div>}
                      {horasDia.map(h=><div key={h.id} style={{fontSize:9,color:C.muted}}>{h.horaEntrada||""}{h.horaEntrada&&h.horaSalida?" - ":""}{h.horaSalida||""}</div>)}
                      {!esFuturo&&esAdmin&&<select style={{fontSize:9,background:"#111",color:"#fff",border:"none",borderRadius:4,width:"100%",marginTop:3,padding:"2px"}} value={estado} onChange={async e=>await setEstadoDiaFn(emp.id,fecha,e.target.value)}>
                        <option value="normal">Normal</option>
                        <option value="descanso">Descanso</option>
                        <option value="falta">Falta</option>
                        <option value="licencia">Licencia</option>
                      </select>}
                      {!esFuturo&&!esAdmin&&estado!=="normal"&&<div style={{fontSize:9,color:colorEstadoDia(estado),fontWeight:700,marginTop:3}}>{estado.charAt(0).toUpperCase()+estado.slice(1)}</div>}
                    </div>;
                  })}
                </div>
              </div>;
            })}
          </>}

          {personalTab==="resumen"&&esAdmin&&<>
            <div style={css.card}><div style={css.cardTitle}>📊 Resumen por Empleado</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Período desde</div><input style={css.input} type="date" value={reciboDesde} onChange={e=>setReciboDesde(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Período hasta</div><input style={css.input} type="date" value={reciboHasta} onChange={e=>setReciboHasta(e.target.value)}/></div>
              </div>
              {empleados.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px"}}>No hay empleados.</p>:
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr><th style={css.th}>Empleado</th><th style={css.th}>Rol</th><th style={css.th}>Horas</th><th style={css.th}>Bruto</th><th style={css.th}>Consumos</th><th style={css.th}>Adelantos</th><th style={css.th}>NETO</th><th style={css.th}>Estado Pago</th><th style={css.th}>Recibo</th></tr></thead>
                  <tbody>{empleados.map(e=>{
                    const r=resumenEmp(e.id,reciboDesde,reciboHasta);
                    return <tr key={e.id}>
                      <td style={{...css.td,fontWeight:600}}>{e.nombre}</td>
                      <td style={css.td}><span style={css.tag(C.info)}>{e.rol}</span></td>
                      <td style={css.td}><span style={{fontWeight:700}}>{r.totalH.toFixed(1)}hs</span></td>
                      <td style={{...css.td,fontWeight:700}}>{fmt(r.bruto)}</td>
                      <td style={{...css.td,color:C.danger}}>- {fmt(r.totalConsumos)}</td>
                      <td style={{...css.td,color:C.danger}}>- {fmt(r.totalAdelantos)}</td>
                      <td style={css.td}><span style={{fontWeight:800,fontSize:14,color:r.neto>=0?C.success:C.danger}}>{fmt(r.neto)}</span></td>
                      <td style={css.td}><button style={{...css.btn("info"),padding:"5px 10px",fontSize:11}} onClick={()=>{setReciboEmp(e);setMostrarRecibo(true);}}>🧾 Ver</button></td>
                    </tr>;
                  })}</tbody>
                </table></div>}
            </div>
          </>}
        </>}

        {/* ══ CONFIGURACIÓN ══ */}
        {/* ══ PÉRDIDAS Y MERMAS ══ */}
        {tab==="perdidas"&&(esCompras||esAdmin)&&<>
          {/* Resumen */}
          <div style={css.grid(140)}>
            <div style={css.stat}><div style={css.statV(C.danger)}>{fmt(totalPerdidas)}</div><div style={css.statL}>Total pérdidas período</div></div>
            <div style={css.stat}><div style={css.statV(C.warn)}>{perdidasFiltradas.filter(p=>p.tipo==="Pérdida de insumos").length}</div><div style={css.statL}>Pérdidas de insumos</div></div>
            <div style={css.stat}><div style={css.statV(C.accent)}>{perdidasFiltradas.filter(p=>p.tipo==="Pérdida de producto elaborado").length}</div><div style={css.statL}>Productos perdidos</div></div>
            <div style={css.stat}><div style={css.statV(C.info)}>{perdidasFiltradas.filter(p=>p.tipo==="Reconocimiento a cliente").length}</div><div style={css.statL}>Reconocimientos</div></div>
          </div>

          {/* Formulario */}
          <div style={css.card}>
            <div style={css.cardTitle}>📝 Registrar Evento</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Tipo de evento *</div>
                <select style={css.sel} value={pTipo} onChange={e=>{setPTipo(e.target.value);setPInsumo("");setPProducto("");setPMonto("");}}>
                  <option>Pérdida de insumos</option>
                  <option>Pérdida de producto elaborado</option>
                  <option>Reconocimiento a cliente</option>
                </select>
              </div>
              {pTipo==="Reconocimiento a cliente"&&<>
                <div style={css.col}><div style={css.lbl}>Nº Comanda *</div><input style={css.input} placeholder="Ej: 42" value={pComanda} onChange={e=>setPComanda(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Tipo de reconocimiento</div>
                  <select style={css.sel} value={pSubTipo} onChange={e=>{setPSubTipo(e.target.value);setPProducto("");setPMonto("");}}>
                    <option value="reposicion">Reposición de producto</option>
                    <option value="devolucion">Devolución de dinero</option>
                  </select>
                </div>
              </>}
            </div>
            <div style={css.row}>
              {pTipo==="Pérdida de insumos"&&<div style={css.col}><div style={css.lbl}>Insumo *</div>
                <select style={css.sel} value={pInsumo} onChange={e=>{setPInsumo(e.target.value);}}>
                  <option value="">— Seleccionar insumo —</option>
                  {ARTICULOS_COMPRAS.map(a=><option key={a.nombre} value={a.nombre}>{a.nombre} ({a.categoria})</option>)}
                </select>
              </div>}
              {(pTipo==="Pérdida de producto elaborado"||(pTipo==="Reconocimiento a cliente"&&pSubTipo==="reposicion"))&&<div style={css.col}><div style={css.lbl}>Producto *</div>
                <select style={css.sel} value={pProducto} onChange={e=>{setPProducto(e.target.value);const p=productos.find(x=>x.nombre===e.target.value);if(p)setPCosto(String(p.precio));}}>
                  <option value="">— Seleccionar producto —</option>
                  {productos.filter(p=>p.activo).map(p=><option key={p.id} value={p.nombre}>{p.nombre} — {fmt(p.precio)}</option>)}
                </select>
              </div>}
              {pTipo==="Reconocimiento a cliente"&&pSubTipo==="devolucion"&&<div style={{...css.col,maxWidth:180}}><div style={css.lbl}>Monto devuelto ($) *</div><input style={css.input} type="number" placeholder="0" value={pMonto} onChange={e=>setPMonto(e.target.value)}/></div>}
              <div style={{...css.col,maxWidth:120}}><div style={css.lbl}>Cantidad</div><input style={{...css.input,maxWidth:120}} type="number" step="0.1" min="0" placeholder="0" value={pCantidad} onChange={e=>setPCantidad(e.target.value)}/></div>
              <div style={{...css.col,maxWidth:180}}><div style={css.lbl}>Costo estimado ($)</div><input style={css.input} type="number" placeholder="Autocompletado" value={pCosto} onChange={e=>setPCosto(e.target.value)}/></div>
            </div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Descripción</div><input style={css.input} placeholder="Ej: Empanadas rotas en el horno, harina con gorgojo..." value={pDesc} onChange={e=>setPDesc(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Estado</div>
                <select style={css.sel} value={pEstado} onChange={e=>setPEstado(e.target.value)}>
                  <option>Pendiente</option><option>Resuelto</option><option>Descontado</option>
                </select>
              </div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn()} onClick={guardarPerdida}>✅ Registrar</button></div>
            </div>
          </div>

          {/* Filtros */}
          <div style={css.card}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase"}}>🔍 Filtros</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={pfDesde} onChange={e=>setPfDesde(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={pfHasta} onChange={e=>setPfHasta(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Tipo</div>
                <select style={css.sel} value={pfTipo} onChange={e=>setPfTipo(e.target.value)}>
                  <option value="">— Todos —</option>
                  <option>Pérdida de insumos</option>
                  <option>Pérdida de producto elaborado</option>
                  <option>Reconocimiento a cliente</option>
                </select>
              </div>
              <div style={css.col}><div style={css.lbl}>Estado</div>
                <select style={css.sel} value={pfEstado} onChange={e=>setPfEstado(e.target.value)}>
                  <option value="">— Todos —</option>
                  <option>Pendiente</option><option>Resuelto</option><option>Descontado</option>
                </select>
              </div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setPfDesde("");setPfHasta("");setPfTipo("");setPfEstado("");}}>✕ Limpiar</button></div>
            </div>
          </div>

          {/* Listado */}
          <div style={css.card}>
            <div style={css.cardTitle}>📋 Registro de Pérdidas — {perdidasFiltradas.length} evento{perdidasFiltradas.length!==1?"s":""}</div>
            {perdidasFiltradas.length===0?<p style={{color:C.muted,textAlign:"center",padding:"36px 0"}}>Sin registros en el período.</p>:
              <div style={{overflowX:"auto"}}><table style={css.table}>
                <thead><tr>
                  <th style={css.th}>Fecha</th>
                  <th style={css.th}>Tipo</th>
                  <th style={css.th}>Comanda</th>
                  <th style={css.th}>Insumo / Producto</th>
                  <th style={css.th}>Cant.</th>
                  <th style={css.th}>Costo / Monto</th>
                  <th style={css.th}>Descripción</th>
                  <th style={css.th}>Usuario</th>
                  <th style={css.th}>Estado</th>
                  {esAdmin&&<th style={css.th}></th>}
                </tr></thead>
                <tbody>{perdidasFiltradas.map(p=>{
                  const colorTipo = p.tipo==="Pérdida de insumos"?C.danger:p.tipo==="Pérdida de producto elaborado"?C.warn:C.info;
                  const colorEstado = p.estado==="Resuelto"?C.success:p.estado==="Descontado"?C.info:C.warn;
                  const afectado = p.insumo||p.producto||"—";
                  const valor = p.costoEstimado>0?p.costoEstimado:p.monto>0?p.monto:0;
                  return <tr key={p.id}>
                    <td style={css.td}>{new Date(p.fechaHora).toLocaleDateString("es-AR")} {new Date(p.fechaHora).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</td>
                    <td style={css.td}><span style={css.tag(colorTipo)}>{p.tipo==="Pérdida de insumos"?"🧂 Insumo":p.tipo==="Pérdida de producto elaborado"?"🍕 Producto":"🤝 Reconoc."}</span></td>
                    <td style={css.td}>{p.comanda||"—"}</td>
                    <td style={{...css.td,fontWeight:600,maxWidth:160}}>{afectado}</td>
                    <td style={css.td}>{p.cantidad>0?p.cantidad:"—"}</td>
                    <td style={{...css.td,fontWeight:700,color:C.danger}}>{valor>0?fmt(valor):"—"}</td>
                    <td style={{...css.td,color:C.muted,maxWidth:160,fontSize:11}}>{p.descripcion||"—"}</td>
                    <td style={css.td}>{p.usuario||"—"}</td>
                    <td style={css.td}>
                      {esAdmin
                        ?<select style={{...css.sel,minWidth:100,fontSize:11,padding:"4px 8px"}} value={p.estado} onChange={e=>cambiarEstadoPerdida(p.id,e.target.value)}>
                          <option>Pendiente</option><option>Resuelto</option><option>Descontado</option>
                        </select>
                        :<span style={{...css.tag(colorEstado)}}>{p.estado}</span>}
                    </td>
                    {esAdmin&&<td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>eliminarPerdida(p.id)}>🗑</button></td>}
                  </tr>;
                })}</tbody>
              </table></div>}
            {totalPerdidas>0&&<div style={css.total}><div style={{fontSize:11,color:C.muted}}>TOTAL PÉRDIDAS EN PERÍODO</div><div style={{fontSize:22,fontWeight:800,color:C.danger}}>{fmt(totalPerdidas)}</div></div>}
          </div>
        </>}

        {tab==="config"&&esAdmin&&<>
          <div style={css.card}><div style={css.cardTitle}>🏪 Datos del local (salen en la factura impresa)</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Nombre</div><input style={css.input} value={datosLocal.nombre} onChange={e=>setDatosLocal(p=>({...p,nombre:e.target.value}))}/></div>
              <div style={{...css.col,flex:2}}><div style={css.lbl}>Dirección</div><input style={css.input} placeholder="Ej: Av. Illia 123, San Luis" value={datosLocal.direccion} onChange={e=>setDatosLocal(p=>({...p,direccion:e.target.value}))}/></div>
            </div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Teléfono / WhatsApp</div><input style={css.input} placeholder="Ej: 266 4123456" value={datosLocal.telefono} onChange={e=>setDatosLocal(p=>({...p,telefono:e.target.value}))}/></div>
              <div style={css.col}><div style={css.lbl}>Instagram</div><input style={css.input} placeholder="Ej: @foodieslk" value={datosLocal.instagram} onChange={e=>setDatosLocal(p=>({...p,instagram:e.target.value}))}/></div>
              <div style={css.col}><div style={css.lbl}>CUIT (opcional)</div><input style={css.input} value={datosLocal.cuit} onChange={e=>setDatosLocal(p=>({...p,cuit:e.target.value}))}/></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginTop:8}}><button style={css.btn()} onClick={guardarDatosLocal}>💾 Guardar datos del local</button>{datosLocalGuardado&&<span style={{color:C.success,fontSize:12,fontWeight:700}}>✓ Guardado</span>}</div>
          </div>
          {[
            {titulo:"👤 Vendedores",lista:vendedores,setLista:setVendedores,key:"v",tipo:"vendedor"},
            {titulo:"🛵 Cadetes",lista:cadetes,setLista:setCadetes,key:"c",tipo:"cadete"},
            {titulo:"💳 Medios de Pago",lista:mediosPago,setLista:setMediosPago,key:"m",tipo:"medio_pago"},
            {titulo:"🏪 Tipos de Venta",lista:tiposVenta,setLista:setTiposVenta,key:"t",tipo:"tipo_venta"},
          ].map(({titulo,lista,setLista,key,tipo})=>(
            <div key={key} style={css.card}><div style={css.cardTitle}>{titulo}</div>
              <div style={{marginBottom:12,flexWrap:"wrap",display:"flex"}}>
                {lista.map(item=>(<div key={item} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#1f1f1f",border:`1px solid ${C.border}`,borderRadius:999,padding:"5px 12px",marginRight:8,marginBottom:8,fontSize:12,fontWeight:600}}>
                  {item}
                  <button style={{background:"none",border:"none",cursor:"pointer",color:C.danger,fontWeight:800,fontSize:14,padding:0,lineHeight:1}} onClick={async()=>{
                    setLista(prev=>prev.filter(x=>x!==item));
                    // Find the record ID first then delete by ID
                    const {data:rows} = await supabase.from("configuracion").select("id").eq("tipo",tipo).eq("valor",item);
                    if(rows&&rows.length>0) {
                      for(const row of rows) {
                        await supabase.from("configuracion").delete().eq("id",row.id);
                      }
                    }
                  }}>×</button>
                </div>))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input style={{...css.input,maxWidth:240}} placeholder="Nuevo..." value={cfgInput[key]}
                  onChange={e=>setCfgInput(p=>({...p,[key]:e.target.value}))}
                  onKeyDown={async e=>{
                    if(e.key==="Enter"&&cfgInput[key].trim()){
                      const val=cfgInput[key].trim();
                      setLista(prev=>[...prev,val]);
                      setCfgInput(p=>({...p,[key]:""}));
                      const {error} = await supabase.from("configuracion").insert({id:gid(),tipo,valor:val,activo:true});
                      if(error) console.error("insert config error:",error);
                    }
                  }}/>
                <button style={css.btn()} onClick={async()=>{
                  if(cfgInput[key].trim()){
                    const val=cfgInput[key].trim();
                    setLista(prev=>[...prev,val]);
                    setCfgInput(p=>({...p,[key]:""}));
                    const {error} = await supabase.from("configuracion").insert({id:gid(),tipo,valor:val,activo:true});
                    if(error) console.error("insert config error:",error);
                  }
                }}>+ Agregar</button>
              </div>
            </div>
          ))}
        </>}
      </main>
    </div>
  );
}
