import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const USUARIOS = {
  admin:    { pass:"kokis1990",   rol:"admin" },
  empleado: { pass:"LKFOODIES",  rol:"empleado" },
  compras:  { pass:"compras2026", rol:"compras" },
};

const DIAS_ALERTA = 30;
const gid = () => Math.random().toString(36).substr(2,9);
const hoy = () => new Date().toISOString().split("T")[0];
const fmt = (n) => `$${Number(n||0).toLocaleString("es-AR")}`;
const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const fmtFecha = (fecha) => {
  if(!fecha) return "—";
  const d = new Date(fecha+"T12:00:00");
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}-${mm}-${yy} ${DIAS[d.getDay()]}`;
};
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

const emptyNf = (ta) => ({ fecha:ta?.fecha||hoy(), turno:ta?.turno||(new Date().getHours()<16?"Mañana":"Noche"), tipoVenta:"Salon", vendedor:ta?.vendedor||"", cadete:"", clienteId:"", comanda:"", medioPago1:"Efectivo", importe1:"", medioPago2:"", importe2:"", items:[], notas:"" });
const emptyNc = () => ({ fecha:hoy(), proveedor:"", nroFactura:"", tipoFactura:"Mercadería para venta", formaPago:"Efectivo", obs:"", items:[] });
const montoTransfer = (f) => (f.medioPago1==="Transferencia"?f.importe1:0)+(f.medioPago2==="Transferencia"?f.importe2:0);
const tieneTransfer = (f) => montoTransfer(f)>0;

const VENDEDORES_DEF = ["Eugenia","Noelia","Jorge","Lucas","Victoria"];
const CADETES_DEF = ["Gaston","Jorge","Kevin","Retiro","Noe","Gabi"];
const MEDIOS_DEF = ["Efectivo","Transferencia","Cuenta Corriente"];
const TIPOS_VENTA_DEF = ["Salon","Envio","Mostrador"];
const TIPOS_FACTURA_COMPRA = ["Mercadería para venta","Insumos de producción","Gasto operativo"];
const FORMAS_PAGO_COMPRA = ["Efectivo","Transferencia","Cuenta Corriente","Cheque"];

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
    <table><thead><tr><th>Fecha</th><th>Turno</th><th>Entrada</th><th>Salida</th><th>Horas</th><th>Valor/h</th><th>Subtotal</th></tr></thead>
    <tbody>${horasFilt.map(h=>{const _d=new Date(h.fecha+"T12:00:00");const _dias=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];const _dd=String(_d.getDate()).padStart(2,"0");const _mm=String(_d.getMonth()+1).padStart(2,"0");const _yy=String(_d.getFullYear()).slice(2);const _fF=`${_dd}-${_mm}-${_yy} ${_dias[_d.getDay()]}`;return `<tr><td>${_fF}</td><td>${h.turno||"—"}</td><td>${h.horaEntrada||"—"}</td><td>${h.horaSalida||"—"}</td><td>${h.horas}hs</td><td>${fmt(emp.valorHora)}</td><td>${fmt(h.horas*emp.valorHora)}</td></tr>`;}
    ).join("")}
    <tr class="tr"><td colspan="2"><b>Total ${totalHoras.toFixed(1)} horas</b></td><td></td><td><b>${fmt(bruto)}</b></td></tr></tbody></table>
    ${consumos.length?`<table><thead><tr><th>Consumos</th><th>Fecha</th><th>Monto</th></tr></thead><tbody>
    ${consumos.map(m=>`<tr><td>${m.descripcion||"—"}</td><td>${m.fecha}</td><td class="neg">- ${fmt(m.monto)}</td></tr>`).join("")}
    <tr class="tr"><td colspan="2"><b>Total consumos</b></td><td class="neg"><b>- ${fmt(totalConsumos)}</b></td></tr></tbody></table>`:""}
    ${adelantos.length?`<table><thead><tr><th>Adelantos</th><th>Fecha</th><th>Monto</th></tr></thead><tbody>
    ${adelantos.map(m=>`<tr><td>${m.descripcion||"—"}</td><td>${m.fecha}</td><td class="neg">- ${fmt(m.monto)}</td></tr>`).join("")}
    <tr class="tr"><td colspan="2"><b>Total adelantos</b></td><td class="neg"><b>- ${fmt(totalAdelantos)}</b></td></tr></tbody></table>`:""}
    <div style="border-top:2px solid #f97316;padding-top:14px;text-align:right;margin-top:8px">
    <span style="font-size:13px;color:#555">TOTAL NETO A PERCIBIR: </span><span class="neto">${fmt(neto)}</span></div>
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
            <thead><tr><th style={css.th}>Fecha</th><th style={css.th}>Turno</th><th style={{...css.th,color:C.success}}>Entrada</th><th style={{...css.th,color:C.danger}}>Salida</th><th style={css.th}>Horas</th><th style={css.th}>Valor/h</th><th style={css.th}>Subtotal</th></tr></thead>
            <tbody>
              {horasFilt.map(h=><tr key={h.id}>
                <td style={css.td}>{fmtFecha(h.fecha)}</td>
                <td style={css.td}>{h.turno||"—"}</td>
                <td style={{...css.td,color:C.success,fontWeight:700}}>{h.horaEntrada||"—"}</td>
                <td style={{...css.td,color:C.danger,fontWeight:700}}>{h.horaSalida||"—"}</td>
                <td style={css.td}>{h.horas}hs</td>
                <td style={css.td}>{fmt(emp.valorHora)}</td>
                <td style={{...css.td,fontWeight:700}}>{fmt(h.horas*emp.valorHora)}</td>
              </tr>)}
              <tr style={{background:"#1a1a1a"}}><td style={{...css.td,fontWeight:700}} colSpan={4}>Total {totalHoras.toFixed(1)} horas</td><td style={css.td}></td><td style={css.td}></td><td style={{...css.td,fontWeight:800,color:C.accent,fontSize:14}}>{fmt(bruto)}</td></tr>
            </tbody>
          </table>
        </>}
        {consumos.length>0&&<>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase"}}>Consumos</div>
          <table style={{...css.table,marginBottom:12}}>
            <thead><tr><th style={css.th}>Descripción</th><th style={css.th}>Fecha</th><th style={css.th}>Monto</th></tr></thead>
            <tbody>{consumos.map(m=><tr key={m.id}><td style={css.td}>{m.descripcion||"—"}</td><td style={css.td}>{m.fecha}</td><td style={{...css.td,color:C.danger,fontWeight:700}}>- {fmt(m.monto)}</td></tr>)}</tbody>
          </table>
        </>}
        {adelantos.length>0&&<>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase"}}>Adelantos</div>
          <table style={{...css.table,marginBottom:12}}>
            <thead><tr><th style={css.th}>Descripción</th><th style={css.th}>Fecha</th><th style={css.th}>Monto</th></tr></thead>
            <tbody>{adelantos.map(m=><tr key={m.id}><td style={css.td}>{m.descripcion||"—"}</td><td style={css.td}>{m.fecha}</td><td style={{...css.td,color:C.danger,fontWeight:700}}>- {fmt(m.monto)}</td></tr>)}</tbody>
          </table>
        </>}
        <div style={{background:`linear-gradient(135deg,${C.accent}22,transparent)`,border:`1px solid ${C.accent}44`,borderRadius:10,padding:"16px 18px",marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
            <div><div style={{fontSize:10,color:C.muted}}>Bruto horas</div><div style={{fontWeight:700}}>{fmt(bruto)}</div></div>
            <div><div style={{fontSize:10,color:C.muted}}>Consumos</div><div style={{fontWeight:700,color:C.danger}}>- {fmt(totalConsumos)}</div></div>
            <div><div style={{fontSize:10,color:C.muted}}>Adelantos</div><div style={{fontWeight:700,color:C.danger}}>- {fmt(totalAdelantos)}</div></div>
            <div style={{background:C.accent+"22",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:C.muted}}>NETO A PERCIBIR</div><div style={{fontWeight:800,fontSize:18,color:C.accent}}>{fmt(neto)}</div></div>
          </div>
        </div>
        <div style={{textAlign:"right"}}><button style={{...css.btn(),padding:"10px 24px"}} onClick={imprimir}>🖨️ Imprimir / PDF</button></div>
      </div>
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
  const [vendedores, setVendedores] = useState(VENDEDORES_DEF);
  const [cadetes, setCadetes] = useState(CADETES_DEF);
  // Gastos y retiros
  const [gastosRetiros, setGastosRetiros] = useState([]);
  const [grTipo, setGrTipo] = useState("Gasto");
  const [grConcepto, setGrConcepto] = useState("");
  const [grMonto, setGrMonto] = useState("");
  const [grFiltDesde, setGrFiltDesde] = useState("");
  const [grFiltHasta, setGrFiltHasta] = useState("");
  // Cadetes filtros
  const [cadFiltCadete, setCadFiltCadete] = useState("");
  const [cadFiltDesde, setCadFiltDesde] = useState("");
  const [cadFiltHasta, setCadFiltHasta] = useState("");
  // Historial detalle
  const [factDetalle, setFactDetalle] = useState(null);
  const [compraDetalle, setCompraDetalle] = useState(null);
  const [clienteHistorial, setClienteHistorial] = useState(null);
  const [chDesde, setChDesde] = useState("");
  const [chHasta, setChHasta] = useState("");
  // Ventas x Día
  const [vxdFecha, setVxdFecha] = useState("");
  const [vxdHasta, setVxdHasta] = useState("");
  const [vxdTurno, setVxdTurno] = useState("");
  // Vista semanal personal
  const [semFecha, setSemFecha] = useState(hoy());
  // Reporte mensual
  const [rmDesde, setRmDesde] = useState("");
  const [rmHasta, setRmHasta] = useState("");
  const [informeIA, setInformeIA] = useState("");
  // Horas filtros y edición
  const [horaEditId, setHoraEditId] = useState(null);
  const [filtHoraEmp, setFiltHoraEmp] = useState("");
  const [filtHoraDesde, setFiltHoraDesde] = useState("");
  const [filtHoraHasta, setFiltHoraHasta] = useState("");
  const [mediosPago, setMediosPago] = useState(MEDIOS_DEF);
  const [tiposVenta, setTiposVenta] = useState(TIPOS_VENTA_DEF);
  const [nf, setNf] = useState(emptyNf(null));
  const [bCadete, setBCadete] = useState("");
  const [cheques, setCheques] = useState([]);
  const [chequesTab, setChequesTab] = useState("lista");
  const [nCheque, setNCheque] = useState({proveedor:"",monto:"",fechaEmision:hoy(),fechaPago:"",banco:"",numero:"",obs:""});
  const [guardando, setGuardando] = useState(false);
  const [turnoActivo, setTurnoActivo] = useState(()=>{
    try { const t = localStorage.getItem("foodies_turno_activo"); return t ? JSON.parse(t) : null; }
    catch(e) { return null; }
  });
  const [bVendedor, setBVendedor] = useState("");
  const [bTurno, setBTurno] = useState(new Date().getHours()<16?"Mañana":"Noche");
  const [bTipoVenta, setBTipoVenta] = useState("");
  const [bClienteNf, setBClienteNf] = useState("");
  const [mostrarDropCliente, setMostrarDropCliente] = useState(false);
  const [selProd, setSelProd] = useState(""); const [selQty, setSelQty] = useState(""); const [selPrecio, setSelPrecio] = useState(""); const [selBusq, setSelBusq] = useState("");
  const [editando, setEditando] = useState(null);
  const [editSelProd, setEditSelProd] = useState(""); const [editSelQty, setEditSelQty] = useState(""); const [editSelPrecio, setEditSelPrecio] = useState(""); const [editSelBusq, setEditSelBusq] = useState("");
  // Historial filtros (CAMBIO 4)
  const [bFact, setBFact] = useState("");
  const [hfDesde, setHfDesde] = useState(""); const [hfHasta, setHfHasta] = useState(""); const [hfTurno, setHfTurno] = useState(""); const [hfComanda, setHfComanda] = useState("");
  // Cierres
  const [cierres, setCierres] = useState([]);
  const [cierreFecha, setCierreFecha] = useState(hoy()); const [cierreTurno, setCierreTurno] = useState(new Date().getHours()<16?"Mañana":"Noche");
  const [cierreEfectivo, setCierreEfectivo] = useState(""); const [cierreObs, setCierreObs] = useState("");
  // Filtros cierres (CAMBIO 1)
  const [ccFDesde, setCcFDesde] = useState(""); const [ccFHasta, setCcFHasta] = useState("");
  // Filtros transferencias (CAMBIO 2)
  const [trDesde, setTrDesde] = useState(""); const [trHasta, setTrHasta] = useState("");
  const [pagosCC, setPagosCC] = useState([]);
  const [ccCliente, setCcCliente] = useState(""); const [ccMonto, setCcMonto] = useState(""); const [ccObs, setCcObs] = useState("");
  const [ifDesde, setIfDesde] = useState(""); const [ifHasta, setIfHasta] = useState(""); const [ifVendedor, setIfVendedor] = useState(""); const [ifTurno, setIfTurno] = useState(""); const [ifTipo, setIfTipo] = useState("");
  const [pfNombre, setPfNombre] = useState(""); const [pfPrecio, setPfPrecio] = useState(""); const [pfEdit, setPfEdit] = useState(null); const [bProd, setBProd] = useState("");
  const [prodTab, setProdTab] = useState("gestion");
  const [taComandaInicial, setTaComandaInicial] = useState("");
  const [alertaToken, setAlertaToken] = useState(null); // token de autorización pendiente
  const [alertaEsperando, setAlertaEsperando] = useState(false); // esperando que el admin autorice
  const [alertaId, setAlertaId] = useState(null);
  const [modalAutorizacion, setModalAutorizacion] = useState(null);
  const [talonarios, setTalonarios] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [insumosMovs, setInsumosMovs] = useState([]);
  const [provVisitas, setProvVisitas] = useState([]);
  const [insumosTab, setInsumosTab] = useState("panel");
  const [insumoBusq, setInsumoBusq] = useState("");
  const [modalInsumo, setModalInsumo] = useState(null); // null | 'nuevo' | insumo
  const [insumoForm, setInsumoForm] = useState({nombre:"",categoria:"Carnes",unidad:"kg",proveedorNombre:"",stockMinimo:0});
  const [modalTalonario, setModalTalonario] = useState(false);
  const [talDesde, setTalDesde] = useState("");
  const [talHasta, setTalHasta] = useState("");
  const [talObs, setTalObs] = useState(""); // {tipo, datos, onAutorizado}
  const [pinIngresado, setPinIngresado] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinVerificando, setPinVerificando] = useState(false);
  const [stock, setStock] = useState([]);
  const [stockMovs, setStockMovs] = useState([]);
  const [stockTab, setStockTab] = useState("panel");
  const [stockSelId, setStockSelId] = useState(null);
  const [stockCantidad, setStockCantidad] = useState("");
  const [stockMotivo, setStockMotivo] = useState("");
  // Modal comprobante
  const [modalComprobante, setModalComprobante] = useState(null); // factura seleccionada
  const [cmpNombre, setCmpNombre] = useState("");
  const [cmpApellido, setCmpApellido] = useState("");
  const [cmpDni, setCmpDni] = useState("");
  // Datos del local (configurable)
  const [datosLocal, setDatosLocal] = useState(()=>{
    try { const d=localStorage.getItem("foodies_datos_local"); return d?JSON.parse(d):{nombre:"FOODIES LK",direccion:"",telefono:"",instagram:""}; }
    catch(e){ return {nombre:"FOODIES LK",direccion:"",telefono:"",instagram:""}; }
  });
  const [analProd, setAnalProd] = useState(null);
  const [analBusq, setAnalBusq] = useState("");
  const [analDesde, setAnalDesde] = useState("");
  const [analHasta, setAnalHasta] = useState("");
  const [cfN, setCfN] = useState(""); const [cfA, setCfA] = useState(""); const [cfT, setCfT] = useState(""); const [cfDir, setCfDir] = useState(""); const [bCli, setBCli] = useState("");
  const [cfgInput, setCfgInput] = useState({ v:"", c:"", m:"", t:"" });

  // ── Compras ──
  const [compras, setCompras] = useState([]);
  const [pagosProveedores, setPagosProveedores] = useState([]);
  const [proveedores, setProveedores] = useState(PROVEEDORES_INICIALES);
  const [articulosCompra, setArticulosCompra] = useState([]);
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

    // Ventas — paginado para evitar límite de 1000 filas de Supabase
    try {
      const mapFact = (f, items) => ({
        ...f, id:f.id, numero:f.numero, comanda:f.comanda, fecha:f.fecha,
        turno:f.turno, tipoVenta:f.tipo_venta, vendedor:f.vendedor, cadete:f.cadete,
        cliente:f.cliente, clienteId:f.cliente_id,
        medioPago1:f.medio_pago1, importe1:parseFloat(f.importe1)||0,
        medioPago2:f.medio_pago2, importe2:parseFloat(f.importe2)||0,
        transferConfirmada:f.transfer_confirmada, total:parseFloat(f.total)||0,
        notas:f.notas, estado:f.estado,
        items:(items||[]).filter(i=>i.factura_id===f.id).map(i=>({
          id:i.id,prodId:i.prod_id,nombre:i.nombre,
          precio:parseFloat(i.precio)||0,qty:parseFloat(i.qty)||0
        }))
      });

      // Paginar facturas de a 1000
      let allFacts = [];
      let page = 0;
      const pageSize = 1000;
      while(true) {
        const { data:batch, error:errB } = await supabase
          .from("facturas").select("*")
          .order("created_at",{ascending:false})
          .range(page*pageSize, (page+1)*pageSize-1);
        if(errB) break;
        if(!batch || batch.length===0) break;
        allFacts = allFacts.concat(batch);
        if(batch.length < pageSize) break;
        page++;
      }

      // Paginar items de a 1000
      let allItems = [];
      page = 0;
      while(true) {
        const { data:batch } = await supabase
          .from("factura_items").select("*")
          .range(page*pageSize, (page+1)*pageSize-1);
        if(!batch || batch.length===0) break;
        allItems = allItems.concat(batch);
        if(batch.length < pageSize) break;
        page++;
      }

      if(allFacts.length > 0) setFacturas(allFacts.map(f=>mapFact(f, allItems)));
    } catch(e) { console.error("facturas:",e); }

    try {
      const { data:cierresDb } = await supabase.from("cierres_caja").select("*").order("created_at",{ascending:false});
      if(cierresDb) setCierres(cierresDb.map(c=>({
        id:c.id, fecha:c.fecha, turno:c.turno, facturas:parseInt(c.facturas_count)||0,
        efectivo:parseFloat(c.efectivo)||0, transferConfirmada:parseFloat(c.transfer_confirmada)||0,
        transferPendiente:parseFloat(c.transfer_pendiente)||0, cuentaCorriente:parseFloat(c.cuenta_corriente)||0,
        efectivoContado:parseFloat(c.efectivo_contado)||0, gastosContado:parseFloat(c.gastos)||0, retiros:parseFloat(c.retiros)||0,
        efectivoEsperado:parseFloat(c.efectivo_esperado)||0, diferencia:parseFloat(c.diferencia)||0, obs:c.obs||"",
        comandaInicial:c.comanda_inicial||null
      })));
    } catch(e) { console.error("cierres:",e); }

    try {
      const { data:chDb } = await supabase.from("cheques").select("*").order("fecha_pago",{ascending:true});
      if(chDb) setCheques(chDb.map(ch=>({
        id:ch.id, compraId:ch.compra_id, proveedor:ch.proveedor,
        monto:parseFloat(ch.monto)||0, fechaEmision:ch.fecha_emision,
        fechaPago:ch.fecha_pago, estado:ch.estado||"pendiente",
        banco:ch.banco||"", numero:ch.numero||"", obs:ch.obs||""
      })));
    } catch(e) { console.error("cheques:",e); }

    // Cargar artículos de compra con último precio desde compra_items
    try {
      const { data:artsDb } = await supabase.from("articulos_compra").select("*").order("nombre",{ascending:true});
      if(artsDb && artsDb.length>0){
        // Para cada artículo, buscar el último precio en compra_items
        const { data:ultimosPrecios } = await supabase
          .from("compra_items")
          .select("nombre, precio, compra_id, compras(fecha)")
          .order("compras(fecha)",{ascending:false});
        const preciosMap = {};
        (ultimosPrecios||[]).forEach(i=>{
          if(!preciosMap[i.nombre]) preciosMap[i.nombre] = parseFloat(i.precio)||0;
        });
        setArticulosCompra(artsDb.map(a=>({
          nombre:a.nombre, categoria:a.categoria||"Mercadería",
          unidad:a.unidad||"", activo:a.activo,
          ultimoPrecio:preciosMap[a.nombre]||0
        })));
      }
    } catch(e) { console.error("articulos_compra:",e); }

    try {
      const { data:stDb } = await supabase.from("stock").select("*").order("categoria").order("nombre");
      if(stDb) setStock(stDb.map(s=>({
        id:s.id, nombre:s.nombre, categoria:s.categoria,
        stockActual:parseFloat(s.stock_actual)||0,
        stockMinimo:parseFloat(s.stock_minimo)||0,
        unidad:s.unidad||"unidad", activo:s.activo
      })));
      const { data:movsDb } = await supabase.from("stock_movimientos").select("*").order("created_at",{ascending:false}).limit(200);
      if(movsDb) setStockMovs(movsDb.map(m=>({
        id:m.id, stockId:m.stock_id, tipo:m.tipo,
        cantidad:parseFloat(m.cantidad)||0,
        motivo:m.motivo, referenciaId:m.referencia_id,
        fecha:m.fecha, hora:m.hora, usuario:m.usuario
      })));
    } catch(e) { console.error("stock:",e); }

    try {
      const { data:talDb } = await supabase.from("talonarios").select("*").order("created_at",{ascending:false});
      if(talDb) setTalonarios(talDb.map(t=>({
        id:t.id, desde:t.numero_desde, hasta:t.numero_hasta,
        fechaInicio:t.fecha_inicio, fechaCierre:t.fecha_cierre,
        turnoInicio:t.turno_inicio, vendedor:t.vendedor,
        estado:t.estado, obs:t.obs
      })));
    } catch(e) { console.error("talonarios:",e); }

    try {
      const [insDb, movDb, visDb] = await Promise.all([
        supabase.from("insumos").select("*").eq("activo",true).order("categoria").order("nombre"),
        supabase.from("insumos_movimientos").select("*").order("created_at",{ascending:false}).limit(300),
        supabase.from("proveedores_visitas").select("*").eq("activo",true).order("proveedor_nombre")
      ]);
      if(insDb.data) setInsumos(insDb.data.map(i=>({
        id:i.id, nombre:i.nombre, categoria:i.categoria, unidad:i.unidad,
        proveedorNombre:i.proveedor_nombre, stockActual:parseFloat(i.stock_actual)||0,
        stockMinimo:parseFloat(i.stock_minimo)||0, activo:i.activo
      })));
      if(movDb.data) setInsumosMovs(movDb.data.map(m=>({
        id:m.id, insumoId:m.insumo_id, tipo:m.tipo,
        cantidad:parseFloat(m.cantidad)||0, stockResultante:parseFloat(m.stock_resultante)||0,
        motivo:m.motivo, compraId:m.compra_id, fecha:m.fecha, hora:m.hora, usuario:m.usuario
      })));
      if(visDb.data) setProvVisitas(visDb.data.map(v=>({
        id:v.id, proveedorNombre:v.proveedor_nombre,
        diasVisita:v.dias_visita||[], horaVisita:v.hora_visita||"", obs:v.obs||""
      })));
    } catch(e) { console.error("insumos:",e); }

    // Cargar gastos y retiros
    try {
      const { data:grDb } = await supabase.from("gastos_retiros").select("*").order("created_at",{ascending:false});
      if(grDb) setGastosRetiros(grDb.map(g=>({
        id:g.id, fecha:g.fecha, hora:g.hora||"", turno:g.turno,
        tipo:g.tipo, concepto:g.concepto, monto:parseFloat(g.monto)||0, cierreId:g.cierre_id
      })));
    } catch(e) { console.error("gastos_retiros:",e); }

    try {
      const { data:pagos } = await supabase.from("pagos_cc").select("*").order("created_at",{ascending:false});
      if(pagos) setPagosCC(pagos.map(p=>({id:p.id,clienteId:p.cliente_id,clienteNombre:p.cliente_nombre,monto:p.monto,fecha:p.fecha,obs:p.obs})));
    } catch(e) { console.error("pagos_cc:",e); }

    try {
      const { data:config } = await supabase.from("configuracion").select("*");
      if(config) {
        const v=config.filter(c=>c.tipo==="vendedor").map(c=>c.valor); if(v.length) setVendedores(v);
        const ca=config.filter(c=>c.tipo==="cadete").map(c=>c.valor); if(ca.length) setCadetes(ca);
        const m=config.filter(c=>c.tipo==="medio_pago").map(c=>c.valor); if(m.length) setMediosPago(m);
        const t=config.filter(c=>c.tipo==="tipo_venta").map(c=>c.valor); if(t.length) setTiposVenta(t);
      }
    } catch(e) { console.error("config:",e); }

    // Clientes — tabla nueva, manejo robusto
    try {
      const { data:clientesDb, error:errCli } = await supabase.from("clientes").select("*").order("nombre",{ascending:true});
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
      const { data:empsDb } = await supabase.from("empleados").select("*").order("nombre",{ascending:true});
      if(empsDb) setEmpleados(empsDb.map(e=>({id:e.id,nombre:e.nombre,dni:e.dni||"",telefono:e.telefono||"",telefonoAlt:e.telefono_alt||"",direccion:e.direccion||"",email:e.email||"",rol:e.rol||"Ayudante",valorHora:parseFloat(e.valor_hora)||0,fechaIngreso:e.fecha_ingreso||"",notas:e.notas||"",categoria:e.categoria||"",activo:e.activo!==false})));
    } catch(e) { console.error("empleados:",e); }

    try {
      const { data:horasDb } = await supabase.from("horas_trabajo").select("*").order("fecha",{ascending:false});
      if(horasDb) setHorasTrabajo(horasDb.map(h=>({id:h.id,empleadoId:h.empleado_id,fecha:h.fecha,horas:parseFloat(h.horas),horaEntrada:h.hora_entrada||"",horaSalida:h.hora_salida||"",turno:h.turno||"",obs:h.obs||""})));
    } catch(e) { console.error("horas:",e); }

    try {
      const { data:movsDb } = await supabase.from("movimientos_personal").select("*").order("fecha",{ascending:false});
      if(movsDb) setMovimientosPersonal(movsDb.map(m=>({id:m.id,empleadoId:m.empleado_id,tipo:m.tipo,monto:parseFloat(m.monto),fecha:m.fecha,descripcion:m.descripcion||""})));
    } catch(e) { console.error("movimientos:",e); }

    try {
      const { data:prodsDb } = await supabase.from("productos").select("*").order("nombre",{ascending:true});
      if(prodsDb && prodsDb.length>0) setProductos(prodsDb.map(p=>({id:p.id,nombre:p.nombre,precio:parseFloat(p.precio)||0,activo:p.activo})));
      else setProductos(PRODUCTOS_INICIALES);
    } catch(e) { console.error("productos:",e); setProductos(PRODUCTOS_INICIALES); }

    // Compras desde Supabase
    try {
      const { data:comprasDb, error:errCompras } = await supabase
        .from("compras")
        .select("*, compra_items(*)")
        .order("created_at",{ascending:false});
      if(errCompras) throw errCompras;
      if(comprasDb) setCompras(comprasDb.map(comp=>({
        id:comp.id, numero:comp.numero, fecha:comp.fecha, proveedor:comp.proveedor,
        nroFactura:comp.nro_factura||"", tipoFactura:comp.tipo_factura||"",
        formaPago:comp.forma_pago||"", obs:comp.obs||"", total:parseFloat(comp.total)||0,
        pagado:parseFloat(comp.pagado)||0, estado:comp.estado||"pendiente",
        items:(comp.compra_items||[]).map(i=>({
          id:i.id,nombre:i.nombre,categoria:i.categoria||"",precio:parseFloat(i.precio)||0,qty:parseFloat(i.qty)||0
        }))
      })));
    } catch(e) { console.error("compras:",e); }

    try {
      const { data:perdidasDb } = await supabase.from("perdidas").select("*").order("fecha_hora",{ascending:false});
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
        <div style={{fontSize:40,marginBottom:8}}>🍔</div>
        <div style={{fontSize:24,fontWeight:800,color:C.accent,marginBottom:4}}>Foodies</div>
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
  const totalItems = nf.items.reduce((s,i)=>s+i.precio*i.qty,0);
  const totalPagos = (parseFloat(String(nf.importe1).replace(/[^0-9.-]/g,""))||0)+(parseFloat(String(nf.importe2).replace(/[^0-9.-]/g,""))||0);
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

  const guardar = async () => {
    if(guardando) return;
    setGuardando(true);
    try {
    // Usar vendedor del turno activo si nf.vendedor está vacío
    const vendedorFinal = nf.vendedor || turnoActivo?.vendedor || "";
    if(!vendedorFinal||nf.items.length===0) return;
    if(nf.vendedor !== vendedorFinal) setNf(p=>({...p,vendedor:vendedorFinal}));
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
    setFacturas(prev=>[f,...prev]); const ta = turnoActivo;
    setNf(emptyNf(ta));
    setBClienteNf(""); setBCadete(""); setBTipoVenta("");
    setBVendedor(ta?.vendedor||"");
    setBTurno(ta?.turno||"");
    alert("✅ Factura guardada correctamente");
    } catch(err) {
      console.error("Error guardando factura:", err);
      alert("Error al guardar. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarTransfer = async (id) => {
    await supabase.from("facturas").update({transfer_confirmada:true}).eq("id",id);
    setFacturas(prev=>prev.map(f=>f.id===id?{...f,transferConfirmada:true}:f));
  };

  const abrirEdicion = (f) => { setEditando({...f,items:[...f.items]}); setEditSelBusq(""); setEditSelProd(""); setEditSelQty(""); setEditSelPrecio(""); };

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
    await supabase.from("pagos_cc").insert({id,cliente_id:ccCliente,cliente_nombre:cli?.nombre||"",monto:parseFloat(ccMonto),fecha:hoy(),obs:ccObs});
    setPagosCC(prev=>[...prev,{id,clienteId:ccCliente,clienteNombre:cli?.nombre||"",monto:parseFloat(ccMonto),fecha:hoy(),obs:ccObs}]);
    setCcMonto(""); setCcObs("");
  };

  // ── CAJA ──
  const factCierre = facturas.filter(f=>f.fecha===cierreFecha&&f.turno===cierreTurno&&f.estado==="pagada");
  const cierreEf = factCierre.reduce((s,f)=>s+(f.medioPago1==="Efectivo"?f.importe1:0)+(f.medioPago2==="Efectivo"?f.importe2:0),0);
  const cierreTrConf = factCierre.filter(f=>tieneTransfer(f)&&f.transferConfirmada===true).reduce((s,f)=>s+montoTransfer(f),0);
  const cierreTrPend = factCierre.filter(f=>tieneTransfer(f)&&f.transferConfirmada===false);
  const cierreTrPendMonto = cierreTrPend.reduce((s,f)=>s+montoTransfer(f),0);
  const cierreCC = factCierre.reduce((s,f)=>s+(f.medioPago1==="Cuenta Corriente"?f.importe1:0)+(f.medioPago2==="Cuenta Corriente"?f.importe2:0),0);
  // Gastos y retiros del turno actual (aún no vinculados a ningún cierre)
  const grTurno = gastosRetiros.filter(g=>g.fecha===cierreFecha&&g.turno===cierreTurno&&!g.cierreId);
  const gastosContado = grTurno.filter(g=>g.tipo==="Gasto").reduce((s,g)=>s+g.monto,0);
  const retirosContado = grTurno.filter(g=>g.tipo==="Retiro").reduce((s,g)=>s+g.monto,0);
  const efectivoContado = parseFloat(cierreEfectivo)||0;
  // Nueva fórmula: (Efectivo físico + Gastos + Retiros) vs Ventas en efectivo
  const efectivoEsperado = efectivoContado + gastosContado + retirosContado;
  const difCaja = efectivoEsperado - cierreEf;

  const guardarGastoRetiro = async () => {
    if(!grConcepto||grMonto==="") return;
    const id = gid();
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2,"0")}:${String(ahora.getMinutes()).padStart(2,"0")}`;
    const reg = {id,fecha:cierreFecha,hora:horaActual,turno:cierreTurno,tipo:grTipo,concepto:grConcepto,monto:parseFloat(grMonto)||0,cierreId:null};
    await supabase.from("gastos_retiros").insert({id,fecha:cierreFecha,hora:horaActual,turno:cierreTurno,tipo:grTipo,concepto:grConcepto,monto:parseFloat(grMonto)||0});
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
    const cierresOrdenados = cierres.filter(x=>x.id!==cierre.id).sort((a,b)=>
      b.fecha.localeCompare(a.fecha)||(b.turno==="Noche"?1:-1));
    const cierreAnterior = cierresOrdenados[0]||null;
    const ultimaCmdAnterior = cierreAnterior ? facturas
      .filter(f=>f.fecha===cierreAnterior.fecha&&f.turno===cierreAnterior.turno&&f.comanda&&f.comanda!=="—"&&!isNaN(parseInt(f.comanda)))
      .reduce((max,f)=>Math.max(max,parseInt(f.comanda)),0)||null : null;
    const saltoEntreTurnos = (cmdInicial&&ultimaCmdAnterior) ? cmdInicial - ultimaCmdAnterior - 1 : null;

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
    const totalEfectivo = factDia.reduce((s,f)=>s+(f.medioPago1==="Efectivo"?parseFloat(f.importe1)||0:0)+(f.medioPago2==="Efectivo"?parseFloat(f.importe2)||0:0),0);
    const totalTransfer = factDia.reduce((s,f)=>s+(f.medioPago1==="Transferencia"?parseFloat(f.importe1)||0:0)+(f.medioPago2==="Transferencia"?parseFloat(f.importe2)||0:0),0);
    const totalCC = factDia.reduce((s,f)=>s+(f.medioPago1==="Cuenta Corriente"?parseFloat(f.importe1)||0:0)+(f.medioPago2==="Cuenta Corriente"?parseFloat(f.importe2)||0:0),0);
    const totalVentas = totalEfectivo + totalTransfer + totalCC;
    const trConf = factDia.filter(f=>tieneTransfer(f)&&f.transferConfirmada===true);
    const trConfMonto = trConf.reduce((s,f)=>s+montoTransfer(f),0);
    const trPendMonto = trPend.reduce((s,f)=>s+montoTransfer(f),0);
    const gastosT = grDia.filter(g=>g.tipo==="Gasto").reduce((s,g)=>s+g.monto,0);
    const retirosT = grDia.filter(g=>g.tipo==="Retiro").reduce((s,g)=>s+g.monto,0);
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
        const montoCC=(f.medioPago1==="Cuenta Corriente"?parseFloat(f.importe1)||0:0)+(f.medioPago2==="Cuenta Corriente"?parseFloat(f.importe2)||0:0);
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

  const setTurnoActivoPersistente = (ta) => {
    setTurnoActivo(ta);
    try {
      if(ta) localStorage.setItem("foodies_turno_activo", JSON.stringify(ta));
      else localStorage.removeItem("foodies_turno_activo");
    } catch(e) { console.error("localStorage:", e); }
  };

  const guardarCierre = async () => {
    const id = gid();
    const cr = {id,fecha:cierreFecha,turno:cierreTurno,facturas:factCierre.length,
      efectivo:cierreEf,transferConfirmada:cierreTrConf,transferPendiente:cierreTrPendMonto,
      cuentaCorriente:cierreCC,efectivoContado,gastosContado,retiros:retirosContado,efectivoEsperado,diferencia:difCaja,obs:cierreObs,
      comandaInicial:turnoActivo?.comandaInicial||null};
    if(grTurno.length>0){
      await supabase.from("gastos_retiros").update({cierre_id:id}).in("id",grTurno.map(g=>g.id));
      setGastosRetiros(prev=>prev.map(g=>grTurno.find(x=>x.id===g.id)?{...g,cierreId:id}:g));
    }
    await supabase.from("cierres_caja").insert({id,fecha:cierreFecha,turno:cierreTurno,facturas_count:factCierre.length,
      efectivo:cierreEf,transfer_confirmada:cierreTrConf,transfer_pendiente:cierreTrPendMonto,cuenta_corriente:cierreCC,
      efectivo_contado:efectivoContado,gastos:gastosContado,retiros:retirosContado,efectivo_esperado:efectivoEsperado,diferencia:difCaja,obs:cierreObs,
      comanda_inicial:turnoActivo?.comandaInicial||null});
    setCierres(prev=>[cr,...prev]); setCierreEfectivo(""); setCierreObs("");
    // Cerrar el turno automáticamente al guardar el cierre
    setTurnoActivoPersistente(null);
    alert("✅ Cierre guardado. El turno fue cerrado automáticamente.");
  };

  // ── COMPRAS ──
  const totalNc = nc.items.reduce((s,i)=>s+i.precio*i.qty,0);

  const guardarCompra = async () => {
    if(!nc.proveedor||nc.items.length===0) return;
    const id = gid();
    const total = nc.items.reduce((s,i)=>s+i.precio*i.qty,0);
    // Solo Cuenta Corriente queda pendiente, el resto se paga en el momento
    const estadoInicial = nc.formaPago==="Cuenta Corriente" ? "pendiente" : "pagada";
    const comp = { id, numero:`COM-${String(compras.length+1).padStart(5,"0")}`,
      fecha:nc.fecha, proveedor:nc.proveedor, nroFactura:nc.nroFactura,
      tipoFactura:nc.tipoFactura, formaPago:nc.formaPago, obs:nc.obs,
      items:[...nc.items], total, pagado:estadoInicial==="pagada"?total:0, estado:estadoInicial };
    try {
      const { error:errComp } = await supabase.from("compras").insert({
        id, numero:comp.numero, fecha:comp.fecha, proveedor:comp.proveedor,
        nro_factura:comp.nroFactura||"", tipo_factura:comp.tipoFactura,
        forma_pago:comp.formaPago, obs:comp.obs||"", total,
        pagado:comp.pagado, estado:estadoInicial
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

      // Si se pagó con cheque, crear registro en tabla cheques
      if(nc.formaPago==="Cheque" && nc.fechaPagoCheque) {
        const chId = gid();
        await supabase.from("cheques").insert({
          id:chId, compra_id:id, proveedor:nc.proveedor, monto:total,
          fecha_emision:nc.fecha, fecha_pago:nc.fechaPagoCheque,
          estado:"pendiente", banco:nc.bancoCheque||"", numero:nc.numeroCheque||""
        });
        setCheques(prev=>[{id:chId,compraId:id,proveedor:nc.proveedor,monto:total,
          fechaEmision:nc.fecha,fechaPago:nc.fechaPagoCheque,estado:"pendiente",
          banco:nc.bancoCheque||"",numero:nc.numeroCheque||"",obs:""},...prev]);
      }

      // Actualizar últimos precios en articulosCompra
      nc.items.forEach(item=>{
        setArticulosCompra(prev=>prev.map(a=>a.nombre===item.nombre?{...a,ultimoPrecio:parseFloat(item.precio)||a.ultimoPrecio}:a));
      });
      setCompras(prev=>[comp,...prev]); setNc(emptyNc()); setNcBusqProv(""); setComprasTab("historial");
    } catch(e) { console.error("guardarCompra excepcion:",e); alert("Error inesperado: "+e.message); }
  };

  const registrarPagoProveedor = async () => {
    if(!ppProveedor||!ppMonto) return;
    const id = gid();
    const pago = {id,proveedor:ppProveedor,monto:parseFloat(ppMonto),forma:ppForma,obs:ppObs,nroFactura:ppNroFact,fecha:hoy()};
    setPagosProveedores(prev=>[pago,...prev]);
    const montoPago = parseFloat(ppMonto)||0;
    // Aplicar el pago a las compras pendientes del proveedor (las más antiguas primero)
    const comprasPend = compras
      .filter(comp=>comp.proveedor===ppProveedor&&esCC(comp.formaPago)&&comp.estado!=="pagada")
      .sort((a,b)=>a.fecha.localeCompare(b.fecha));
    let restante = montoPago;
    for(const comp of comprasPend){
      if(restante<=0) break;
      const saldoComp = comp.total-(parseFloat(comp.pagado)||0);
      const aplicar = Math.min(restante, saldoComp);
      const nuevoPagado = (parseFloat(comp.pagado)||0)+aplicar;
      const nuevoEstado = nuevoPagado>=comp.total?"pagada":"parcial";
      await supabase.from("compras").update({pagado:nuevoPagado,estado:nuevoEstado}).eq("id",comp.id);
      setCompras(prev=>prev.map(x=>x.id===comp.id?{...x,pagado:nuevoPagado,estado:nuevoEstado}:x));
      restante-=aplicar;
    }
    setPpProveedor(""); setPpMonto(""); setPpObs(""); setPpNroFact("");
  };

  const esCC = (fp) => fp&&fp.toLowerCase().replace(/\s/g,"").includes("cuentacorriente");

  // Verificar PIN contra Supabase (hash SHA256)
  const verificarPin = async (pin) => {
    try {
      // Hash del PIN ingresado usando crypto.subtle
      const msgBuffer = new TextEncoder().encode(pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
      const { data } = await supabase.from("seguridad_config").select("pin_autorizacion,codigo_maestro").eq("id","config").single();
      return data && (hashHex === data.pin_autorizacion || hashHex === data.codigo_maestro);
    } catch(e) { console.error("Error verificando PIN:",e); return false; }
  };

  const estadoCuentaProveedores = () => {
    const cuentas = {};
    // Solo compras en cuenta corriente que estén pendientes
    compras.filter(c=>esCC(c.formaPago)&&c.estado!=="pagada").forEach(comp=>{
      if(!cuentas[comp.proveedor]) cuentas[comp.proveedor]={deuda:0,pagado:0,ultimaCompra:comp.fecha,facturasMasAntigua:comp.fecha};
      const saldoComp = comp.total - (parseFloat(comp.pagado)||0);
      cuentas[comp.proveedor].deuda += saldoComp;
      if(comp.fecha>cuentas[comp.proveedor].ultimaCompra) cuentas[comp.proveedor].ultimaCompra=comp.fecha;
      if(comp.fecha<cuentas[comp.proveedor].facturasMasAntigua) cuentas[comp.proveedor].facturasMasAntigua=comp.fecha;
    });
    pagosProveedores.forEach(p=>{
      if(!cuentas[p.proveedor]) cuentas[p.proveedor]={deuda:0,pagado:0,ultimaCompra:"",facturasMasAntigua:""};
      cuentas[p.proveedor].pagado+=p.monto;
    });
    return Object.entries(cuentas)
      .map(([prov,v])=>({proveedor:prov,deuda:v.deuda,pagado:v.pagado,saldo:v.deuda-v.pagado,ultimaCompra:v.ultimaCompra,diasSinPago:diasDesde(v.facturasMasAntigua)}))
      .filter(x=>x.saldo>0)
      .sort((a,b)=>b.saldo-a.saldo);
  };

  const comprasVencidas = compras.filter(c=>esCC(c.formaPago)&&c.estado!=="pagada"&&diasDesde(c.fecha)>DIAS_ALERTA);
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
    if(horaEditId) {
      await supabase.from("horas_trabajo").update({empleado_id:horaEmpId,fecha:horaFecha,horas,hora_entrada:horaEntrada,hora_salida:horaSalida,turno:horaTurno,obs:horaObs}).eq("id",horaEditId);
      setHorasTrabajo(prev=>prev.map(x=>x.id===horaEditId?{...x,empleadoId:horaEmpId,fecha:horaFecha,horas,horaEntrada,horaSalida,turno:horaTurno,obs:horaObs}:x));
      setHoraEditId(null);
    } else {
      const id = gid();
      const reg = {id,empleadoId:horaEmpId,fecha:horaFecha,horas,horaEntrada,horaSalida,turno:horaTurno,obs:horaObs};
      await supabase.from("horas_trabajo").insert({id,empleado_id:horaEmpId,fecha:horaFecha,horas,hora_entrada:horaEntrada,hora_salida:horaSalida,turno:horaTurno,obs:horaObs});
      setHorasTrabajo(prev=>[reg,...prev]);
    }
    setHoraEntrada(""); setHoraSalida(""); setHoraObs("");
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
    facturasCC.forEach(f=>{ const k=f.clienteId||f.cliente||"Sin cliente"; const n=f.cliente||"Sin cliente"; if(!saldos[k]) saldos[k]={nombre:n,deuda:0,pagado:0}; saldos[k].deuda+=((f.medioPago1==="Cuenta Corriente"?f.importe1:0)+(f.medioPago2==="Cuenta Corriente"?f.importe2:0)); });
    pagosCC.forEach(p=>{ if(!saldos[p.clienteId]) saldos[p.clienteId]={nombre:p.clienteNombre,deuda:0,pagado:0}; saldos[p.clienteId].pagado+=p.monto; });
    return Object.entries(saldos).map(([k,v])=>({...v,key:k,saldo:v.deuda-v.pagado}));
  };
  const saldosCC = saldoPorCliente();
  const deudaTotalCC = saldosCC.reduce((s,x)=>s+(x.saldo>0?x.saldo:0),0);
  const transferPendientes = facturas.filter(f=>tieneTransfer(f)&&f.transferConfirmada===false);
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
  const cierresFilt = cierres.filter(c=>(!ccFDesde||c.fecha>=ccFDesde)&&(!ccFHasta||c.fecha<=ccFHasta));
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
    ...(esAdmin?[{k:"informes",l:"📊 Informes"},{k:"cadetes",l:"🛵 Cadetes"},{k:"ventasxdia",l:"📅 Ventas x Día"},{k:"reportemensual",l:"📈 Reporte Mensual"}]:[]),
    ...(esVentas?[{k:"stock",l:"📦 Stock"},{k:"insumos",l:"🧺 Insumos"}]:[]),
    ...(esVentas?[{k:"productos",l:"🛍 Productos"},{k:"clientes",l:"👥 Clientes"}]:[]),
    ...(esCompras||esAdmin?[{k:"compras",l:"📦 Compras",badge:comprasVencidas.length}]:[]),
    {k:"personal",l:"👤 Personal"},
    ...(esCompras||esAdmin?[{k:"perdidas",l:"📉 Pérdidas"}]:[]),
    ...(esAdmin?[{k:"config",l:"⚙️ Configuración"}]:[]),
  ];

  return (
    <div style={css.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}select option{background:#1f1f1f}input::placeholder,textarea::placeholder{color:#555}`}</style>

      {mostrarRecibo&&reciboEmp&&<Recibo emp={reciboEmp} horas={horasTrabajo} movimientos={movimientosPersonal} desde={reciboDesde} hasta={reciboHasta} onClose={()=>setMostrarRecibo(false)}/>}

      {editando&&(()=>{
        const totalEdit = editando.items.reduce((s,i)=>s+(parseFloat(i.precio)||0)*(parseFloat(i.qty)||0),0);
        const pagadoEdit = (parseFloat(editando.importe1)||0)+(parseFloat(editando.importe2)||0);
        const difEdit = totalEdit - pagadoEdit;
        return (
        <div style={css.modal} onClick={e=>{if(e.target===e.currentTarget)setEditando(null);}}>
          <div style={{...css.modalBox,maxWidth:700,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:16,fontWeight:800,color:C.accent,marginBottom:16}}>✏️ Editando Factura #{editando.numero}</div>

            {/* DATOS GENERALES */}
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Fecha</div><input style={css.input} type="date" value={editando.fecha} onChange={e=>setEditando(p=>({...p,fecha:e.target.value}))}/></div>
              <div style={css.col}><div style={css.lbl}>Comanda</div><input style={{...css.input,borderColor:C.accent,fontWeight:700}} type="number" value={editando.comanda==="—"?"":editando.comanda} onChange={e=>setEditando(p=>({...p,comanda:e.target.value||"—"}))}/></div>
            </div>
            <div style={css.row}>
              <div style={{...css.col,position:"relative"}}>
                <div style={css.lbl}>Turno</div>
                <select style={css.sel} value={editando.turno} onChange={e=>setEditando(p=>({...p,turno:e.target.value}))}>
                  {["Mañana","Noche"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{...css.col,position:"relative"}}>
                <div style={css.lbl}>Tipo de Venta</div>
                <select style={css.sel} value={editando.tipoVenta} onChange={e=>setEditando(p=>({...p,tipoVenta:e.target.value}))}>
                  {tiposVenta.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{...css.col,position:"relative"}}>
                <div style={css.lbl}>Vendedor</div>
                <select style={css.sel} value={editando.vendedor} onChange={e=>setEditando(p=>({...p,vendedor:e.target.value}))}>
                  <option value="">— Sel. —</option>
                  {vendedores.map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              {editando.tipoVenta==="Envio"&&<div style={{...css.col,position:"relative"}}>
                <div style={css.lbl}>Cadete</div>
                <select style={css.sel} value={editando.cadete||""} onChange={e=>setEditando(p=>({...p,cadete:e.target.value}))}>
                  <option value="">— Sel. —</option>
                  {cadetes.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>}
            </div>

            {/* BUSCADOR DE PRODUCTOS — igual a nueva factura */}
            <div style={{fontSize:12,fontWeight:700,color:C.muted,marginTop:12,marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>Agregar productos</div>
            <div style={css.row}>
              <div style={{flex:3}}>
                <input style={css.input} placeholder="Buscar producto..." value={editSelBusq||""}
                  onChange={e=>{setEditSelBusq(e.target.value);setEditSelProd("");setEditSelPrecio("");}}
                  onKeyDown={e=>{
                    if(e.key==="Enter"){
                      const primero=prodsActivos.filter(p=>p.nombre.toLowerCase().includes((editSelBusq||"").toLowerCase()))[0];
                      if(primero){setEditSelProd(primero.id);setEditSelBusq(primero.nombre);setEditSelPrecio(String(primero.precio));document.getElementById("edit-qty")?.focus();}
                      e.preventDefault();
                    }
                  }}
                />
                {editSelBusq&&!editSelProd&&prodsActivos.filter(p=>p.nombre.toLowerCase().includes(editSelBusq.toLowerCase())).length>0&&(
                  <div style={{position:"relative"}}><div style={{position:"absolute",top:2,left:0,right:0,background:"#222",border:`1px solid ${C.border}`,borderRadius:6,zIndex:99,maxHeight:180,overflowY:"auto",boxShadow:"0 4px 16px #0008"}}>
                    {prodsActivos.filter(p=>p.nombre.toLowerCase().includes(editSelBusq.toLowerCase())).slice(0,8).map(p=><div key={p.id}
                      style={{padding:"8px 12px",cursor:"pointer",fontSize:13,color:C.text,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}
                      onMouseDown={()=>{setEditSelProd(p.id);setEditSelBusq(p.nombre);setEditSelPrecio(String(p.precio));}}
                    ><span>{p.nombre}</span><span style={{color:C.accent,fontWeight:700}}>{fmt(p.precio)}</span></div>)}
                  </div></div>
                )}
              </div>
              <div style={{...css.col,maxWidth:80}}>
                <input id="edit-qty" style={css.input} type="number" min="1" placeholder="Cant." value={editSelQty} onChange={e=>setEditSelQty(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"){document.getElementById("edit-precio")?.focus();e.preventDefault();}}}
                />
              </div>
              <div style={{...css.col,maxWidth:130}}>
                <input id="edit-precio" style={css.input} type="number" placeholder="Precio" value={editSelPrecio} onChange={e=>setEditSelPrecio(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"){editAddItem();e.preventDefault();}}}
                />
              </div>
              <div style={{display:"flex",alignItems:"flex-end"}}>
                <button style={css.btn()} onClick={editAddItem}>+ Agregar</button>
              </div>
            </div>

            {/* LISTA DE ITEMS */}
            {editando.items.length>0&&<table style={{...css.table,marginTop:8,marginBottom:4}}>
              <thead><tr><th style={css.th}>Producto</th><th style={css.th}>Precio</th><th style={css.th}>Cant.</th><th style={css.th}>Subtotal</th><th style={css.th}></th></tr></thead>
              <tbody>{editando.items.map(i=>{
                const p=parseFloat(i.precio)||0; const q=parseFloat(i.qty)||0;
                return <tr key={i.id}>
                  <td style={css.td}>{i.nombre}</td>
                  <td style={css.td}>{fmt(p)}</td>
                  <td style={css.td}>{q}</td>
                  <td style={{...css.td,fontWeight:700}}>{fmt(p*q)}</td>
                  <td style={css.td}><button style={{...css.btn("danger"),padding:"3px 7px",fontSize:10}} onClick={()=>setEditando(p=>({...p,items:p.items.filter(x=>x.id!==i.id)}))}>✕</button></td>
                </tr>;
              })}</tbody>
            </table>}
            <div style={{textAlign:"right",fontSize:18,fontWeight:900,color:C.accent,margin:"8px 0 12px"}}>Total: {fmt(totalEdit)}</div>

            {/* PAGOS */}
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Medio 1</div><select style={css.sel} value={editando.medioPago1} onChange={e=>setEditando(p=>({...p,medioPago1:e.target.value}))}>{mediosPago.map(m=><option key={m}>{m}</option>)}</select></div>
              <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>Importe 1</div><input style={css.input} type="number" value={editando.importe1||""} onFocus={e=>e.target.select()} onChange={e=>setEditando(p=>({...p,importe1:e.target.value}))}/></div>
              <div style={css.col}><div style={css.lbl}>Medio 2</div><select style={css.sel} value={editando.medioPago2||""} onChange={e=>setEditando(p=>({...p,medioPago2:e.target.value}))}><option value="">— Ninguno —</option>{mediosPago.map(m=><option key={m}>{m}</option>)}</select></div>
              {editando.medioPago2&&<div style={{...css.col,maxWidth:150}}><div style={css.lbl}>Importe 2</div><input style={css.input} type="number" value={editando.importe2||""} onFocus={e=>e.target.select()} onChange={e=>setEditando(p=>({...p,importe2:e.target.value}))}/></div>}
            </div>
            {pagadoEdit>0&&<div style={{background:difEdit===0?"#14532d":difEdit>0?"#7f1d1d":"#713f12",borderRadius:8,padding:"8px 14px",marginTop:8,fontSize:13,fontWeight:700,color:difEdit===0?C.success:difEdit>0?C.danger:C.warn}}>
              {difEdit===0?"✓ Cuadra":difEdit>0?`Falta cobrar ${fmt(difEdit)}`:`Sobra ${fmt(-difEdit)}`}
            </div>}
            <div style={{marginTop:8}}><div style={css.lbl}>Notas</div><input style={css.input} value={editando.notas||""} onChange={e=>setEditando(p=>({...p,notas:e.target.value}))}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
              <button style={css.btn("neutral")} onClick={()=>setEditando(null)}>Cancelar</button>
              <button style={css.btn()} onClick={guardarEdicion}>💾 Guardar cambios</button>
            </div>
          </div>
        </div>
        );
      })()}

      <header style={css.header}>
        <div><div style={css.logo}>🍔 Foodies</div><div style={{fontSize:10,color:C.muted,letterSpacing:"2px",textTransform:"uppercase"}}>Sistema de Gestión</div></div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {transferPendientes.length>0&&<div style={{background:"#7c2d12",border:`1px solid ${C.danger}`,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",color:"#fb923c"}} onClick={()=>setTab("transferencias")}>⚠️ {transferPendientes.length} transf.</div>}
          {deudaTotalCC>0&&esVentas&&<div style={{background:"#1e3a5f",border:`1px solid ${C.info}`,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",color:C.info}} onClick={()=>setTab("cuentacorriente")}>🏦 CC: {fmt(deudaTotalCC)}</div>}
          {comprasVencidas.length>0&&esCompras&&<div style={{background:"#7f1d1d",border:`1px solid ${C.danger}`,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",color:C.danger}} onClick={()=>setTab("compras")}>📦 {comprasVencidas.length} vencidas</div>}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{background:C.input,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",fontSize:11,color:esAdmin?C.accent:esCompras?C.info:C.success,fontWeight:700}}>{esAdmin?"👑 Admin":esCompras?"📦 Compras":"👤 "+usuario.nombre}</div>
            <button style={{background:"#2a2a2a",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",fontSize:11,color:C.muted,cursor:"pointer"}} onClick={()=>setUsuario(null)}>Salir</button>
          </div>
        </div>
      </header>

      <nav style={css.nav}>{navs.map(t=>(
        <button key={t.k} style={css.nb(tab===t.k)} onClick={()=>setTab(t.k)}>
          {t.l}{t.badge>0&&<span style={{position:"absolute",top:-4,right:-4,background:C.danger,color:"#fff",borderRadius:999,fontSize:9,padding:"1px 5px",fontWeight:800}}>{t.badge}</span>}
        </button>
      ))}</nav>

      <main style={css.main}>
        {(()=>{
          const hoy5h = new Date(); hoy5h.setDate(hoy5h.getDate()+5);
          const hoy5strH = hoy5h.toISOString().slice(0,10);
          const chAlerta = cheques.filter(ch=>ch.estado==="pendiente"&&ch.fechaPago<=hoy5strH);
          // Alarma visita proveedor HOY
          const hoyDia = new Date().getDay();
          const provHoy = provVisitas.filter(p=>p.diasVisita&&p.diasVisita.includes(hoyDia));

          return <>
            {provHoy.length>0&&<div style={{background:"#0f2a0f",border:`2px solid ${C.success}`,borderRadius:10,padding:"12px 16px",marginBottom:10,cursor:"pointer"}} onClick={()=>setTab("insumos")}>
              <div style={{fontWeight:800,color:C.success,fontSize:13,marginBottom:6}}>📦 HOY TIENEN VISITA — {provHoy.map(p=>p.proveedorNombre).join(" · ")}</div>
              {provHoy.map(p=>{
                const insumosDelProv = insumos.filter(i=>i.proveedorNombre===p.proveedorNombre);
                const bajos = insumosDelProv.filter(i=>i.stockActual<=i.stockMinimo&&i.stockMinimo>0);
                return <div key={p.id} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:12}}>{p.proveedorNombre}{p.horaVisita?` — ${p.horaVisita}`:""}</span>
                  {bajos.map(i=><span key={i.id} style={{background:"#7f1d1d",color:C.danger,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700}}>⚠️ {i.nombre}: {i.stockActual} {i.unidad}</span>)}
                  {bajos.length===0&&insumosDelProv.length>0&&<span style={{color:C.success,fontSize:11}}>✅ Stock OK</span>}
                </div>;
              })}
            </div>}
            {chAlerta.length>0&&esCompras&&<div style={{background:"#7c2d12",border:`1px solid ${C.danger}`,borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",color:"#fb923c",marginBottom:8}} onClick={()=>{setTab("compras");setComprasTab("cheques");}}>
            🏦 {chAlerta.length} cheque{chAlerta.length>1?"s":""} por vencer
          </div>}
          </>;
        })()}
        {esVentas&&<div style={css.grid(120)}>
          <div style={css.stat}><div style={css.statV()}>{facturas.length}</div><div style={css.statL}>Facturas</div></div>
          <div style={css.stat}><div style={css.statV()}>{fmt(facturas.reduce((s,f)=>s+f.total,0))}</div><div style={css.statL}>Total ventas</div></div>
          <div style={css.stat}><div style={css.statV(C.success)}>{fmt(facturas.reduce((s,f)=>s+(f.medioPago1==="Efectivo"?f.importe1:0)+(f.medioPago2==="Efectivo"?f.importe2:0),0))}</div><div style={css.statL}>Efectivo</div></div>
          <div style={css.stat}><div style={css.statV(C.warn)}>{fmt(transferPendientes.reduce((s,f)=>s+montoTransfer(f),0))}</div><div style={css.statL}>Transf. pend.</div></div>
          <div style={css.stat}><div style={css.statV(deudaTotalCC>0?C.info:C.success)}>{fmt(deudaTotalCC)}</div><div style={css.statL}>Deuda CC</div></div>
        </div>}
        {esCompras&&!esVentas&&<div style={css.grid(140)}>
          <div style={css.stat}><div style={css.statV()}>{compras.length}</div><div style={css.statL}>Compras</div></div>
          <div style={css.stat}><div style={css.statV(C.danger)}>{fmt(compras.reduce((s,c)=>s+c.total,0))}</div><div style={css.statL}>Total comprado</div></div>
          <div style={css.stat}><div style={css.statV(C.warn)}>{fmt(deudaTotalProveedores)}</div><div style={css.statL}>Deuda proveedores</div></div>
          <div style={css.stat}><div style={css.statV(C.accent)}>{empleados.filter(e=>e.activo).length}</div><div style={css.statL}>Empleados activos</div></div>
        </div>}

        {/* ══ NUEVA FACTURA ══ */}
        {tab==="nueva"&&esVentas&&<>

          {/* ══ INICIO DE TURNO ══ */}
          {/* ══ PANTALLA DE ESPERA DE AUTORIZACIÓN ══ */}
          {!turnoActivo
            ? <div style={{...css.card,border:`2px solid ${C.accent}`,textAlign:"center",padding:"32px 24px"}}>
                <div style={{fontSize:22,marginBottom:8}}>🕐 Iniciar Turno</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Completá los datos del turno. Podés cambiar la fecha si estás cargando facturas de otro día.</div>
                <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
                  <div style={{textAlign:"left"}}>
                    <div style={css.lbl}>Fecha del turno</div>
                    <input id="ta-fecha" type="date" style={{...css.input,minWidth:160}} defaultValue={hoy()}/>
                  </div>
                  <div style={{textAlign:"left"}}>
                    <div style={css.lbl}>Vendedor</div>
                    <select id="ta-vendedor" style={{...css.sel,minWidth:180}}>
                      <option value="">— Seleccionar —</option>
                      {vendedores.map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{textAlign:"left"}}>
                    <div style={css.lbl}>Turno</div>
                    <select id="ta-turno" style={{...css.sel,minWidth:140}} defaultValue={new Date().getHours()<16?"Mañana":"Noche"}>
                      <option value="Mañana">Mañana</option>
                      <option value="Noche">Noche</option>
                    </select>
                  </div>
                  <div style={{textAlign:"left"}}>
                    <div style={css.lbl}>N° comanda inicial</div>
                    {(()=>{
                      const ultimaComanda = facturas.filter(f=>f.comanda&&f.comanda!=="—"&&!isNaN(parseInt(f.comanda))).sort((a,b)=>b.fecha.localeCompare(a.fecha)||parseInt(b.comanda)-parseInt(a.comanda))[0];
                      const ultimaNum = ultimaComanda?parseInt(ultimaComanda.comanda):null;
                      return <div>
                        <input id="ta-comanda" type="number" style={{...css.input,minWidth:130}} placeholder="Ej: 142"/>
                        {ultimaNum&&<div style={{fontSize:10,color:"#f59e0b",marginTop:3}}>⚠️ Última comanda registrada: <b>#{ultimaNum}</b> ({ultimaComanda.fecha})</div>}
                      </div>;
                    })()}
                  </div>
                </div>
                <button style={{...css.btn(),padding:"12px 32px",fontSize:15}} onClick={()=>{
                  const vend = document.getElementById("ta-vendedor")?.value;
                  const turn = document.getElementById("ta-turno")?.value;
                  const fecha = document.getElementById("ta-fecha")?.value || hoy();
                  if(!vend){ alert("Seleccioná un vendedor"); return; }
                  const comandaIni = document.getElementById("ta-comanda")?.value;
                  const comandaNum = parseInt(comandaIni)||null;
                  
                  // Verificar correlatividad
                  // Buscar última comanda: primero del talonario activo, si no de los últimos 60 días
                  const talActivo = talonarios.find(t=>t.estado==="activo");
                  const ultimaFact = talActivo
                    ? facturas.filter(f=>f.comanda&&!isNaN(parseInt(f.comanda))&&parseInt(f.comanda)>=talActivo.desde&&parseInt(f.comanda)<=talActivo.hasta).sort((a,b)=>parseInt(b.comanda)-parseInt(a.comanda))[0]
                    : facturas.filter(f=>f.comanda&&f.comanda!=="—"&&!isNaN(parseInt(f.comanda))&&f.fecha>=new Date(Date.now()-60*24*60*60*1000).toISOString().split("T")[0]).sort((a,b)=>b.fecha.localeCompare(a.fecha)||parseInt(b.comanda)-parseInt(a.comanda))[0];
                  const ultimaNum = ultimaFact?parseInt(ultimaFact.comanda):null;
                  const diferencia = comandaNum&&ultimaNum ? Math.abs(comandaNum - ultimaNum - 1) : (comandaNum&&!ultimaNum?0:null);
                  
                  // Función para iniciar el turno (se llama directa o después de autorizar)
                  const iniciarTurno = (motivo="normal") => {
                    const ta = {vendedor:vend, turno:turn, fecha, hora:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}), comandaInicial:comandaNum, motivoAutorizacion:motivo};
                    setTurnoActivoPersistente(ta);
                    setNf(emptyNf(ta));
                    setBVendedor(vend);
                    setBTurno(turn);
                    // Registrar la autorización en Supabase
                    if(motivo!=="normal") {
                      supabase.from("alertas_comanda").insert({
                        id:gid(), fecha, turno:turn, vendedor:vend,
                        comanda_ultima:ultimaNum, comanda_ingresada:comandaNum,
                        diferencia:diferencia||0, estado:"autorizado",
                        token:gid(), autorizado_at:new Date().toISOString()
                      }).then(()=>{});
                    }
                  };

                  // Si hay diferencia → mostrar modal de autorización con PIN
                  if(comandaNum!==null && diferencia!==null && diferencia>0) {
                    setModalAutorizacion({
                      vend, turn, fecha, comandaNum, ultimaNum, diferencia,
                      onAutorizado: iniciarTurno
                    });
                    return;
                  }
                  
                  // Sin diferencia → iniciar turno normalmente
                  iniciarTurno("normal");
                }}>✅ Iniciar Turno</button>
              </div>
            : <div style={{background:"#0f2a0f",border:`1px solid ${C.success}`,borderRadius:10,padding:"10px 16px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:16,alignItems:"center",flex:1}}>
                  <span style={{fontSize:18}}>🟢</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,color:C.success,fontSize:14}}>Turno Activo — {turnoActivo.turno}</div>
                    <div style={{fontSize:12,color:C.muted}}>Vendedor: <b style={{color:C.text}}>{turnoActivo.vendedor}</b> · Inicio: {turnoActivo.hora}{turnoActivo.comandaInicial?<span style={{color:"#f59e0b"}}> · Comanda inicial: <b>#{turnoActivo.comandaInicial}</b></span>:null}</div>
                    {(()=>{
                      // Alerta de talonario por agotarse
                      const talActivo = talonarios.find(t=>t.estado==="activo");
                      const ultimaCmdActual = facturas.filter(f=>f.comanda&&f.comanda!=="—"&&!isNaN(parseInt(f.comanda))).reduce((max,f)=>Math.max(max,parseInt(f.comanda)),0);
                      const restanTal = talActivo ? talActivo.hasta - ultimaCmdActual : null;
                      if(talActivo && restanTal!==null && restanTal<=5 && restanTal>=0) {
                        return <div style={{background:"#7f1d1d",borderRadius:6,padding:"8px 12px",marginTop:6,fontSize:12}}>
                          🚨 <b>Talonario por agotarse</b> — quedan {restanTal} comanda(s) (hasta #{talActivo.hasta}). Preparar talonario nuevo.
                        </div>;
                      }
                      return null;
                    })()}
                    {(()=>{
                      if(!turnoActivo.comandaInicial) return null;
                      const talAct2 = talonarios.find(t=>t.estado==="activo");
                      const ultimaAnterior = talAct2
                        ? facturas.filter(f=>f.comanda&&!isNaN(parseInt(f.comanda))&&parseInt(f.comanda)>=talAct2.desde&&parseInt(f.comanda)<=talAct2.hasta&&parseInt(f.comanda)<(turnoActivo.comandaInicial||0)).sort((a,b)=>parseInt(b.comanda)-parseInt(a.comanda))[0]
                        : facturas.filter(f=>f.comanda&&f.comanda!=="—"&&!isNaN(parseInt(f.comanda))&&(f.fecha<turnoActivo.fecha||(f.fecha===turnoActivo.fecha&&f.turno!==turnoActivo.turno))&&f.fecha>=new Date(Date.now()-60*24*60*60*1000).toISOString().split("T")[0]).sort((a,b)=>b.fecha.localeCompare(a.fecha)||parseInt(b.comanda)-parseInt(a.comanda))[0];
                      if(!ultimaAnterior) return null;
                      const ultimaNum = parseInt(ultimaAnterior.comanda);
                      const salto = turnoActivo.comandaInicial - ultimaNum - 1;
                      if(salto===0) return <div style={{fontSize:11,color:C.success}}>✅ Correlatividad OK — continuación de #{ultimaNum}</div>;
                      if(salto>0) return <div style={{fontSize:11,color:C.danger}}>⚠️ Salto de {salto} comanda{salto>1?"s":""} — última del turno anterior: #{ultimaNum}</div>;
                      return null;
                    })()}
                  </div>
                </div>
                <button style={{...css.btn("neutral"),padding:"6px 14px",fontSize:12}} onClick={()=>{
                  setTurnoActivoPersistente(null);
                }}>⏹ Cerrar turno</button>
              </div>
          }

          {turnoActivo&&turnoActivo.fecha&&turnoActivo.fecha!==hoy()&&<div style={{background:"#1a1a0a",border:"1px solid #f59e0b",borderRadius:10,padding:"14px 18px",marginBottom:12}}>
            <div style={{fontWeight:800,color:"#f59e0b",marginBottom:6}}>⚠️ Turno del {turnoActivo.fecha} sigue abierto</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Este turno es de ayer o de un día anterior. Podés cerrarlo y abrir uno nuevo, o continuar cargando en este turno.</div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...css.btn("warn"),fontSize:12}} onClick={()=>setTurnoActivoPersistente(null)}>⏹ Cerrar y abrir nuevo turno</button>
            </div>
          </div>}
          {turnoActivo&&<>
          <div style={css.card}><div style={css.cardTitle}>📋 Datos</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Fecha</div><input style={css.input} type="date" value={nf.fecha} onChange={e=>setNf(p=>({...p,fecha:e.target.value}))}/></div>
              <div style={{...css.col,position:"relative"}}>
  <div style={css.lbl}>Turno</div>
  <input style={css.input} placeholder="Mañana / Noche" value={bTurno}
    onChange={e=>{setBTurno(e.target.value); if(!e.target.value) setNf(p=>({...p,turno:""}));}}
    onFocus={()=>setBTurno(nf.turno||"")}
    onKeyDown={e=>{
      if(e.key==="Enter"){
        const ops=["Mañana","Noche"];
        const primero=ops.filter(x=>x.toLowerCase().includes(bTurno.toLowerCase()))[0];
        if(primero){setNf(p=>({...p,turno:primero}));setBTurno(primero);}
        e.preventDefault();
      }
    }}
  />
  {bTurno&&["Mañana","Noche"].filter(x=>x.toLowerCase().includes(bTurno.toLowerCase())).length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#222",border:`1px solid ${C.border}`,borderRadius:6,zIndex:99,maxHeight:120,overflowY:"auto"}}>
    {["Mañana","Noche"].filter(x=>x.toLowerCase().includes(bTurno.toLowerCase())).map(x=><div key={x}
      style={{padding:"8px 12px",cursor:"pointer",fontSize:13,color:C.text,borderBottom:`1px solid ${C.border}`}}
      onMouseDown={()=>{setNf(p=>({...p,turno:x}));setBTurno(x);}}
    >{x}</div>)}
  </div>}
              </div>
              <div style={{...css.col,position:"relative"}}>
  <div style={css.lbl}>Tipo de Venta</div>
  <input style={css.input} placeholder="Salón / Envío / Mostrador" value={bTipoVenta}
    onChange={e=>setBTipoVenta(e.target.value)}
    onFocus={()=>setBTipoVenta("")}
    onKeyDown={e=>{
      if(e.key==="Enter"){
        const primero=tiposVenta.filter(x=>x.toLowerCase().includes(bTipoVenta.toLowerCase()))[0];
        if(primero){
          const nuevoTipo=primero;
          setNf(p=>{
            let items=p.items.filter(i=>i.nombre!=="ENVIO");
            if(nuevoTipo==="Envio"){
              const prodEnvio=productos.find(x=>x.nombre==="ENVIO")||{id:"P062",nombre:"ENVIO",precio:1500};
              items=[...items,{id:gid(),prodId:prodEnvio.id,nombre:"ENVIO",precio:prodEnvio.precio,qty:1}];
            }
            return {...p,tipoVenta:nuevoTipo,items};
          });
          setBTipoVenta(primero);
          setBCadete("");
        }
        e.preventDefault();
      }
    }}
  />
  {bTipoVenta&&tiposVenta.filter(x=>x.toLowerCase().includes(bTipoVenta.toLowerCase())).length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#222",border:`1px solid ${C.border}`,borderRadius:6,zIndex:99,maxHeight:140,overflowY:"auto"}}>
    {tiposVenta.filter(x=>x.toLowerCase().includes(bTipoVenta.toLowerCase())).map(x=><div key={x}
      style={{padding:"8px 12px",cursor:"pointer",fontSize:13,color:C.text,borderBottom:`1px solid ${C.border}`}}
      onMouseDown={()=>{
        const nuevoTipo=x;
        setNf(p=>{
          let items=p.items.filter(i=>i.nombre!=="ENVIO");
          if(nuevoTipo==="Envio"){
            const prodEnvio=productos.find(z=>z.nombre==="ENVIO")||{id:"P062",nombre:"ENVIO",precio:1500};
            items=[...items,{id:gid(),prodId:prodEnvio.id,nombre:"ENVIO",precio:prodEnvio.precio,qty:1}];
          }
          return {...p,tipoVenta:nuevoTipo,items};
        });
        setBTipoVenta(x);
        setBCadete("");
      }}
    >{x}</div>)}
  </div>}
              </div>

              {nf.tipoVenta==="Envio"&&<div style={{...css.col,position:"relative"}}>
  <div style={css.lbl}>Cadete</div>
  <input style={css.input} placeholder="Escribí el nombre..." value={bCadete}
    onChange={e=>{setBCadete(e.target.value); if(!e.target.value) setNf(p=>({...p,cadete:""}));}}
    onFocus={()=>setBCadete(nf.cadete||"")}
    onKeyDown={e=>{
      if(e.key==="Enter"){
        const primero = cadetes.filter(x=>x.toLowerCase().includes(bCadete.toLowerCase()))[0];
        if(primero){setNf(p=>({...p,cadete:primero}));setBCadete(primero);}
        e.preventDefault();
      }
    }}
  />
  {bCadete&&cadetes.filter(x=>x.toLowerCase().includes(bCadete.toLowerCase())).length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#222",border:`1px solid ${C.border}`,borderRadius:6,zIndex:99,maxHeight:160,overflowY:"auto"}}>
    {cadetes.filter(x=>x.toLowerCase().includes(bCadete.toLowerCase())).map(x=><div key={x}
      style={{padding:"8px 12px",cursor:"pointer",fontSize:13,color:C.text}}
      onMouseDown={()=>{setNf(p=>({...p,cadete:x}));setBCadete(x);}}
    >{x}</div>)}
  </div>}
              </div>}
              <div style={{...css.col,position:"relative",minWidth:200}}>
  <div style={css.lbl}>Cliente</div>
  <input
    style={{...css.input,paddingRight:28}}
    placeholder="Buscar o agregar cliente..."
    value={bClienteNf}
    onChange={e=>{
      setBClienteNf(e.target.value);
      if(!e.target.value){ setNf(p=>({...p,clienteId:"",cliente:""})); }
      setMostrarDropCliente(true);
    }}
    onFocus={()=>setMostrarDropCliente(true)}
    onBlur={()=>setTimeout(()=>setMostrarDropCliente(false),300)}
    onKeyDown={async e=>{
      if(e.key==="Enter" && bClienteNf.trim()){
        const coinciden = clientes.filter(x=>`${x.nombre} ${x.apellido}`.toLowerCase().includes(bClienteNf.toLowerCase()));
        if(coinciden.length>0){
          const x = coinciden[0];
          setNf(p=>({...p,clienteId:x.id,cliente:`${x.nombre} ${x.apellido}`.trim()}));
          setBClienteNf(`${x.nombre} ${x.apellido}`.trim());
        } else {
          const [nombre,...resto] = bClienteNf.trim().split(" ");
          const apellido = resto.join(" ");
          const id = gid();
          await supabase.from("clientes").insert({id,nombre,apellido,telefono:"",direccion:""});
          const nuevo = {id,nombre,apellido,telefono:"",direccion:""};
          setClientes(prev=>[...prev,nuevo]);
          setNf(p=>({...p,clienteId:id,cliente:`${nombre} ${apellido}`.trim()}));
          setBClienteNf(`${nombre} ${apellido}`.trim());
        }
        setMostrarDropCliente(false);
        e.preventDefault();
      }
    }}
  />
  {nf.clienteId&&<span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-30%)",fontSize:11,color:C.success}}>✓</span>}
  {mostrarDropCliente&&bClienteNf&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#222",border:`1px solid ${C.border}`,borderRadius:6,zIndex:99,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 16px #0008"}}>
    {clientes.filter(x=>`${x.nombre} ${x.apellido}`.toLowerCase().includes(bClienteNf.toLowerCase())).slice(0,8).map(x=><div key={x.id}
      style={{padding:"8px 12px",cursor:"pointer",fontSize:13,color:C.text,borderBottom:`1px solid ${C.border}`}}
      onMouseDown={()=>{
        setNf(p=>({...p,clienteId:x.id,cliente:`${x.nombre} ${x.apellido}`.trim()}));
        setBClienteNf(`${x.nombre} ${x.apellido}`.trim());
        setMostrarDropCliente(false);
      }}
    >
      <div style={{fontWeight:600}}>{x.nombre} {x.apellido}</div>
      {x.telefono&&<div style={{fontSize:11,color:C.muted}}>{x.telefono}</div>}
    </div>)}
    {/* Siempre mostrar opción de agregar cuando el texto no coincide exactamente */}
    {!clientes.find(x=>`${x.nombre} ${x.apellido}`.toLowerCase()===bClienteNf.toLowerCase())&&<div
      style={{padding:"10px 12px",cursor:"pointer",fontSize:13,color:C.accent,fontWeight:700,borderTop:`1px solid ${C.border}`,background:"#1a1a2e"}}
      onMouseDown={async(e)=>{
        e.preventDefault();
        e.stopPropagation();
        const [nombre,...resto] = bClienteNf.trim().split(" ");
        const apellido = resto.join(" ");
        const id = gid();
        const {error} = await supabase.from("clientes").insert({id,nombre,apellido,telefono:"",direccion:""});
        if(!error){
          const nuevo = {id,nombre,apellido,telefono:"",direccion:""};
          setClientes(prev=>[...prev,nuevo]);
          setNf(p=>({...p,clienteId:id,cliente:`${nombre} ${apellido}`.trim()}));
          setBClienteNf(`${nombre} ${apellido}`.trim());
          setMostrarDropCliente(false);
        } else {
          alert("Error al crear el cliente. Intentá de nuevo.");
        }
      }}
    >➕ Crear "{bClienteNf}" como nuevo cliente</div>}
  </div>}
              </div>
              <div style={{...css.col,maxWidth:130}}><div style={css.lbl}>🧾 N° Comanda</div><input style={{...css.input,maxWidth:130,borderColor:C.accent,fontWeight:700,fontSize:15}} type="number" placeholder="Ej: 42" value={nf.comanda} onChange={e=>setNf(p=>({...p,comanda:e.target.value}))}/></div>
            </div>
          </div>
          <div style={css.card}><div style={css.cardTitle}>🛒 Productos</div>
            <div style={css.row}>
              <div style={{...css.col,position:"relative"}}><div style={css.lbl}>Escribí para buscar</div>
                <input style={css.input} placeholder="Ej: lomito, pizza, coca..." value={selBusq}
  onChange={e=>{setSelBusq(e.target.value);setSelProd("");setSelPrecio("");}}
  autoComplete="off"
  onKeyDown={e=>{
    if(e.key==="Enter"){
      const primero = productos.filter(p=>p.activo&&p.nombre.toLowerCase().includes(selBusq.toLowerCase()))[0];
      if(primero){setSelProd(primero.id);setSelBusq(primero.nombre);setSelPrecio(String(primero.precio));document.getElementById("inp-qty")?.select();document.getElementById("inp-qty")?.focus();}
      e.preventDefault();
    }
  }}
/>
                {selBusq.length>0&&selProd===""&&(
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:8,zIndex:100,maxHeight:200,overflowY:"auto"}}>
                    {prodsActivos.filter(p=>p.nombre.toLowerCase().includes(selBusq.toLowerCase())).slice(0,10).map(p=>(
                      <div key={p.id} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${C.border}`}} onClick={()=>{setSelProd(p.id);setSelBusq(p.nombre);setSelPrecio(String(p.precio));}} onMouseEnter={e=>e.target.style.background="#2a2a2a"} onMouseLeave={e=>e.target.style.background="transparent"}>
                        {p.nombre} — <span style={{color:C.accent,fontWeight:700}}>{fmt(p.precio)}</span></div>
                    ))}
                    {/* Opción crear nuevo producto si no existe exactamente */}
                    {!prodsActivos.find(p=>p.nombre.toLowerCase()===selBusq.toLowerCase())&&selBusq.trim()&&<div
                      style={{padding:"10px 12px",cursor:"pointer",fontSize:12,color:C.accent,fontWeight:700,borderTop:`1px solid ${C.border}`,background:"#1a1a2e"}}
                      onMouseDown={async(e)=>{
                        e.preventDefault();
                        const nombre = selBusq.trim();
                        const precioNuevo = parseFloat(window.prompt(`Precio para "${nombre}":`))||0;
                        if(!precioNuevo) return;
                        const id = gid();
                        const {error} = await supabase.from("productos").insert({id,nombre,precio:precioNuevo,activo:true});
                        if(!error){
                          const nuevo = {id,nombre,precio:precioNuevo,activo:true};
                          setProductos(prev=>[...prev,nuevo]);
                          setSelProd(id);
                          setSelBusq(nombre);
                          setSelPrecio(String(precioNuevo));
                        } else {
                          alert("Error al crear el producto.");
                        }
                      }}
                    >➕ Crear "{selBusq}" como nuevo producto</div>}
                  </div>
                )}
              </div>
              <div style={{...css.col,maxWidth:80}}><div style={css.lbl}>Cant.</div><input id="inp-qty" style={{...css.input,maxWidth:80}} type="number" min="1" placeholder="1" value={selQty} onChange={e=>setSelQty(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){document.getElementById("inp-precio")?.focus();e.preventDefault();}}}/></div>
              <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>Precio cobrado</div><input id="inp-precio" style={{...css.input,maxWidth:150}} type="number" placeholder="Sugerido" value={selPrecio} onChange={e=>setSelPrecio(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){addItem();e.preventDefault();}}}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn()} onClick={addItem}>+ Agregar</button></div>
            </div>
            {nf.items.length>0&&<>
              <table style={css.table}><thead><tr><th style={css.th}>Producto</th><th style={css.th}>Precio</th><th style={css.th}>Cant.</th><th style={css.th}>Subtotal</th><th style={css.th}></th></tr></thead>
                <tbody>{nf.items.map(i=><tr key={i.id}><td style={css.td}>{i.nombre}</td><td style={css.td}>{fmt(i.precio)}</td><td style={css.td}>{i.qty}</td><td style={{...css.td,fontWeight:700}}>{fmt(i.precio*i.qty)}</td><td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px"}} onClick={()=>setNf(p=>({...p,items:p.items.filter(x=>x.id!==i.id)}))}>✕</button></td></tr>)}</tbody>
              </table>
              <div style={css.total}><div style={{fontSize:10,color:C.muted}}>TOTAL</div><div style={{fontSize:26,fontWeight:800,color:C.accent}}>{fmt(totalItems)}</div></div>
            </>}
          </div>
          <div style={css.card}><div style={css.cardTitle}>💳 Medios de Pago</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Medio 1</div><select style={css.sel} value={nf.medioPago1} onChange={e=>setNf(p=>({...p,medioPago1:e.target.value}))}>{mediosPago.map(m=><option key={m}>{m}</option>)}</select></div>
              <div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Importe 1</div><input style={{...css.input,maxWidth:160}} type="number" placeholder="0" value={nf.importe1} onChange={e=>setNf(p=>({...p,importe1:e.target.value}))} onFocus={e=>e.target.select()}/></div>
              <div style={css.col}><div style={css.lbl}>Medio 2 (opcional)</div><select style={css.sel} value={nf.medioPago2} onChange={e=>setNf(p=>({...p,medioPago2:e.target.value}))}><option value="">— Ninguno —</option>{mediosPago.map(m=><option key={m}>{m}</option>)}</select></div>
              {nf.medioPago2&&<div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Importe 2</div><input style={{...css.input,maxWidth:160}} type="number" placeholder="0" value={nf.importe2} onChange={e=>setNf(p=>({...p,importe2:e.target.value}))} onFocus={e=>e.target.select()}/></div>}
            </div>
            {(nf.medioPago1==="Transferencia"||nf.medioPago2==="Transferencia")&&<div style={{background:"#7c3a0e22",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.warn,marginTop:8}}>⚠️ Transferencia pendiente de confirmación</div>}
            {totalItems>0&&<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}>
              <span style={css.tag(C.accent)}>Total: {fmt(totalItems)}</span>
              <span style={css.tag(C.success)}>Pagado: {fmt(totalPagos)}</span>
              <span style={css.tag(dif===0?C.success:dif>0?C.danger:C.warn)}>{dif===0?"✓ Cuadra":dif>0?`Falta cobrar ${fmt(dif)}`:`Sobra ${fmt(-dif)}`}</span>
            </div>}
          </div>
          <div style={css.card}><div style={css.cardTitle}>📝 Notas</div>
            <textarea style={{...css.input,width:"100%",minHeight:60,resize:"vertical"}} placeholder="Observaciones..." value={nf.notas} onChange={e=>setNf(p=>({...p,notas:e.target.value}))}/>
            <div style={{marginTop:12,textAlign:"right"}}><button style={{...css.btn(),padding:"10px 28px",fontSize:14,opacity:(((!nf.vendedor&&!turnoActivo?.vendedor)||nf.items.length===0)||guardando)?0.4:1}} onClick={guardar} disabled={((!nf.vendedor&&!turnoActivo?.vendedor)||nf.items.length===0)||guardando}>{guardando?"⏳ Guardando...":"💾 Guardar Factura"}</button></div>
          </div>
          </>}
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
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setBFact("");setHfComanda("");setHfDesde("");setHfHasta("");setHfTurno("");}}>✕ Limpiar</button></div>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{ff.length} resultado{ff.length!==1?"s":""}</div>
          </div>
          {ff.length===0?<p style={{color:C.muted,textAlign:"center",padding:"36px 0"}}>Sin resultados.</p>:
            <div style={{overflowX:"auto"}}><table style={css.table}>
              <thead><tr><th style={css.th}>N°</th><th style={css.th}>Comanda</th><th style={css.th}>Fecha</th><th style={css.th}>Turno</th><th style={css.th}>Tipo</th><th style={css.th}>Vendedor</th><th style={css.th}>Pago</th><th style={css.th}>Transf.</th><th style={css.th}>Total</th><th style={css.th}></th></tr></thead>
              <tbody>{ff.map(f=><tr key={f.id}>
                <td style={{...css.td,color:C.accent,fontWeight:700}}>{f.numero}</td>
                <td style={{...css.td,fontWeight:800,fontSize:15}}>{f.comanda!=="—"?`#${f.comanda}`:"—"}</td>
                <td style={css.td}>{f.fecha}</td><td style={css.td}>{f.turno}</td><td style={css.td}>{f.tipoVenta}</td><td style={css.td}>{f.vendedor}</td>
                <td style={css.td}><span style={css.tag(C.accent)}>{f.medioPago1}</span>{f.medioPago2&&<span style={css.tag(C.info)}>{f.medioPago2}</span>}</td>
                <td style={css.td}>{f.transferConfirmada===null?"—":f.transferConfirmada?<span style={css.tag(C.success)}>✅</span>:<span style={{...css.tag(C.warn),cursor:"pointer"}} onClick={()=>confirmarTransfer(f.id)}>⏳ Confirmar</span>}</td>
                <td style={{...css.td,fontWeight:700}}>{fmt(f.total)}</td>
                <td style={css.td}><div style={{display:"flex",gap:5}}>
                  {esVentas&&<button style={{...css.btn("warn"),padding:"4px 8px",fontSize:10}} onClick={()=>abrirEdicion(f)}>✏️</button>}
                  <button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={()=>{setModalComprobante(f);setCmpNombre(f.cliente?.split(" ")[0]||"");setCmpApellido(f.cliente?.split(" ").slice(1).join(" ")||"");setCmpDni("");}}>🖨️</button>
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
          <div style={css.card}>
            <div style={css.cardTitle}>💸 Historial de Gastos y Retiros</div>
            <div style={{background:"#111",borderRadius:9,padding:10,marginBottom:12}}>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={grFiltDesde} onChange={e=>setGrFiltDesde(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={grFiltHasta} onChange={e=>setGrFiltHasta(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setGrFiltDesde("");setGrFiltHasta("");}}>✕</button></div>
              </div>
            </div>
            {(()=>{
              const grf=gastosRetiros.filter(g=>(!grFiltDesde||g.fecha>=grFiltDesde)&&(!grFiltHasta||g.fecha<=grFiltHasta)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
              const tG=grf.filter(g=>g.tipo==="Gasto").reduce((s,g)=>s+g.monto,0);
              const tR=grf.filter(g=>g.tipo==="Retiro").reduce((s,g)=>s+g.monto,0);
              return grf.length===0?<p style={{color:C.muted,textAlign:"center",padding:"20px"}}>Sin registros en el período.</p>
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
                </table></div></>;
            })()}
          </div>

          {cierres.length>0&&<div style={css.card}>
            <div style={css.cardTitle}>📋 Historial de Cierres</div>
            <div style={{background:"#111",borderRadius:9,padding:10,marginBottom:12}}>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={ccFDesde} onChange={e=>setCcFDesde(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={ccFHasta} onChange={e=>setCcFHasta(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
                  <button style={css.btn("neutral")} onClick={()=>{setCcFDesde("");setCcFHasta("");}}>✕</button>
                  <span style={{fontSize:11,color:C.muted,paddingBottom:2}}>{cierresFilt.length} cierre{cierresFilt.length!==1?"s":""}</span>
                </div>
              </div>
            </div>
            {cierresFilt.length===0?<p style={{color:C.muted,textAlign:"center",padding:"20px"}}>Sin cierres en el período.</p>:
            <div style={{overflowX:"auto"}}><table style={css.table}>
              <thead><tr><th style={css.th}>Fecha</th><th style={css.th}>Turno</th><th style={css.th}>Fact.</th><th style={css.th}>Ef. sistema</th><th style={css.th}>Gastos</th><th style={css.th}>Retiros</th><th style={css.th}>Ef. contado</th><th style={css.th}>Diferencia</th><th style={css.th}>Transf. pend.</th><th style={css.th}></th></tr></thead>
              <tbody>{cierresFilt.map(cierre=><tr key={cierre.id}>
                <td style={css.td}>{fmtFecha(cierre.fecha)}</td><td style={css.td}>{cierre.turno}</td><td style={css.td}>{cierre.facturas}</td>
                <td style={css.td}>{fmt(cierre.efectivo)}</td><td style={{...css.td,color:C.danger}}>{fmt(cierre.gastosContado)}</td><td style={{...css.td,color:C.warn}}>{fmt(cierre.retiros||0)}</td><td style={css.td}>{fmt(cierre.efectivoContado)}</td>
                <td style={css.td}><span style={{fontWeight:800,color:cierre.diferencia===0?C.success:cierre.diferencia>0?C.warn:C.danger}}>{cierre.diferencia===0?"✓":cierre.diferencia>0?`+${fmt(cierre.diferencia)}`:fmt(cierre.diferencia)}</span></td>
                <td style={{...css.td,color:cierre.transferPendiente>0?C.warn:C.muted}}>{cierre.transferPendiente>0?fmt(cierre.transferPendiente):"—"}</td>
                <td style={css.td}><button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={()=>generarReporteDia(cierre)}>📄 Reporte</button></td>
              </tr>)}</tbody>
            </table></div>}
          </div>}
        </>}

        {/* ══ CUENTA CORRIENTE ══ */}
        {tab==="cuentacorriente"&&esVentas&&<>
          <div style={css.card}><div style={css.cardTitle}>🏦 Saldos CC</div>
            {saldosCC.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px 0"}}>No hay movimientos.</p>:
              <table style={css.table}><thead><tr><th style={css.th}>Cliente</th><th style={css.th}>Deuda</th><th style={css.th}>Pagado</th><th style={css.th}>Saldo</th></tr></thead>
                <tbody>{saldosCC.map(x=><tr key={x.key} style={{background:x.saldo>0?"#1e3a5f11":"transparent"}}><td style={{...css.td,fontWeight:600}}>{x.nombre}</td><td style={{...css.td,color:C.danger}}>{fmt(x.deuda)}</td><td style={{...css.td,color:C.success}}>{fmt(x.pagado)}</td><td style={css.td}><span style={{fontWeight:800,fontSize:14,color:x.saldo>0?C.warn:C.success}}>{x.saldo>0?fmt(x.saldo):"✅ Al día"}</span></td></tr>)}</tbody>
              </table>}
            {deudaTotalCC>0&&<div style={css.total}><div style={{fontSize:11,color:C.muted}}>DEUDA TOTAL</div><div style={{fontSize:24,fontWeight:800,color:C.warn}}>{fmt(deudaTotalCC)}</div></div>}
          </div>
          <div style={css.card}><div style={css.cardTitle}>💵 Registrar Pago</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Cliente</div><select style={css.sel} value={ccCliente} onChange={e=>setCcCliente(e.target.value)}><option value="">— Seleccionar —</option>{saldosCC.filter(x=>x.saldo>0).map(x=><option key={x.key} value={x.key}>{x.nombre} — debe {fmt(x.saldo)}</option>)}</select></div>
              <div style={{...css.col,maxWidth:160}}><div style={css.lbl}>Monto ($)</div><input style={css.input} type="number" placeholder="0" value={ccMonto} onChange={e=>setCcMonto(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Obs.</div><input style={css.input} placeholder="Ej: pagó en efectivo" value={ccObs} onChange={e=>setCcObs(e.target.value)}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("success")} onClick={registrarPagoCC}>✅ Registrar</button></div>
            </div>
          </div>
          {pagosCC.length>0&&<div style={css.card}><div style={css.cardTitle}>📋 Historial Pagos</div>
            <table style={css.table}><thead><tr><th style={css.th}>Fecha</th><th style={css.th}>Cliente</th><th style={css.th}>Monto</th><th style={css.th}>Obs.</th></tr></thead>
              <tbody>{pagosCC.map(p=><tr key={p.id}><td style={css.td}>{p.fecha}</td><td style={{...css.td,fontWeight:600}}>{p.clienteNombre}</td><td style={{...css.td,fontWeight:700,color:C.success}}>{fmt(p.monto)}</td><td style={{...css.td,color:C.muted}}>{p.obs||"—"}</td></tr>)}</tbody>
            </table>
          </div>}
        </>}

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
        {tab==="productos"&&esVentas&&<>
          {/* Tabs del módulo productos */}
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            <button style={{...css.btn(prodTab==="gestion"?"primary":"neutral"),fontSize:12}} onClick={()=>setProdTab("gestion")}>🛍 Gestión</button>
            <button style={{...css.btn(prodTab==="analisis"?"primary":"neutral"),fontSize:12}} onClick={()=>setProdTab("analisis")}>📊 Análisis de Ventas</button>
          </div>

          {prodTab==="gestion"&&<div style={css.card}><div style={css.cardTitle}>🛍 Gestión de Productos</div>
          <div style={{background:"#111",padding:12,borderRadius:9,marginBottom:14}}>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>{pfEdit?"Editando":"Nombre"}</div><input style={css.input} placeholder="Nombre del producto" value={pfNombre} onChange={e=>setPfNombre(e.target.value)}/></div>
              <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>Precio ($)</div><input style={{...css.input,maxWidth:150}} type="number" placeholder="0" value={pfPrecio} onChange={e=>setPfPrecio(e.target.value)}/></div>
              <div style={{display:"flex",gap:6,alignItems:"flex-end"}}>
                <button style={css.btn()} onClick={async()=>{ if(!pfNombre||pfPrecio==="") return; const precio=parseFloat(pfPrecio); if(pfEdit){ await supabase.from("productos").update({nombre:pfNombre,precio}).eq("id",pfEdit); setProductos(prev=>prev.map(p=>p.id===pfEdit?{...p,nombre:pfNombre,precio}:p)); setPfEdit(null); } else { const id=gid(); await supabase.from("productos").insert({id,nombre:pfNombre,precio,activo:true}); setProductos(prev=>[...prev,{id,nombre:pfNombre,precio,activo:true}]); } setPfNombre(""); setPfPrecio(""); }}>{pfEdit?"✓ Guardar":"+ Agregar"}</button>
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
                <button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={()=>setProductos(prev=>prev.map(x=>x.id===p.id?{...x,activo:!x.activo}:x))}>{p.activo?"Desact.":"Activar"}</button>
                <button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>{if(window.confirm("¿Eliminar?"))setProductos(prev=>prev.filter(x=>x.id!==p.id));}}>🗑</button>
              </div></td>}
            </tr>)}</tbody>
          </table></div>
        </div>}

          {prodTab==="analisis"&&(()=>{
            // Calcular historial del producto seleccionado desde facturas cargadas
            const historial = analProd ? facturas.filter(f=>{
              if(f.estado!=="pagada") return false;
              if(analDesde && f.fecha<analDesde) return false;
              if(analHasta && f.fecha>analHasta) return false;
              return (f.items||[]).some(i=>i.nombre===analProd||i.prodId===analProd);
            }).flatMap(f=>(f.items||[])
              .filter(i=>i.nombre===analProd||i.prodId===analProd)
              .map(i=>({
                fecha:f.fecha, numero:f.numero, comanda:f.comanda,
                vendedor:f.vendedor, cliente:f.cliente||"—",
                precio:parseFloat(i.precio)||0, qty:parseFloat(i.qty)||0,
                subtotal:(parseFloat(i.precio)||0)*(parseFloat(i.qty)||0)
              }))
            ).sort((a,b)=>b.fecha.localeCompare(a.fecha)) : [];

            const totalUnidades = historial.reduce((s,h)=>s+h.qty,0);
            const precioMin = historial.length>0?Math.min(...historial.map(h=>h.precio)):0;
            const precioMax = historial.length>0?Math.max(...historial.map(h=>h.precio)):0;
            const precioPromedio = historial.length>0?Math.round(historial.reduce((s,h)=>s+h.precio,0)/historial.length):0;
            const precioActual = productos.find(p=>p.nombre===analProd)?.precio||0;

            // Agrupar por precio para ver historial de precios
            const preciosMap = {};
            historial.forEach(h=>{
              const k = h.precio;
              if(!preciosMap[k]) preciosMap[k]={precio:h.precio,veces:0,unidades:0,primera:h.fecha,ultima:h.fecha};
              preciosMap[k].veces++;
              preciosMap[k].unidades+=h.qty;
              if(h.fecha<preciosMap[k].primera) preciosMap[k].primera=h.fecha;
              if(h.fecha>preciosMap[k].ultima) preciosMap[k].ultima=h.fecha;
            });
            const histPrecios = Object.values(preciosMap).sort((a,b)=>a.precio-b.precio);

            return <div style={css.card}>
              <div style={css.cardTitle}>📊 Análisis de Ventas por Producto</div>

              {/* Filtros */}
              <div style={{background:"#111",borderRadius:9,padding:12,marginBottom:14}}>
                <div style={css.row}>
                  <div style={{flex:2,position:"relative"}}>
                    <div style={css.lbl}>Producto</div>
                    <input style={css.input} placeholder="Buscar producto..." value={analBusq}
                      onChange={e=>{setAnalBusq(e.target.value); setAnalProd(null);}}
                    />
                    {analBusq&&!analProd&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#222",border:`1px solid ${C.border}`,borderRadius:6,zIndex:99,maxHeight:200,overflowY:"auto"}}>
                      {productos.filter(p=>p.nombre.toLowerCase().includes(analBusq.toLowerCase())).slice(0,10).map(p=><div key={p.id}
                        style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}
                        onMouseDown={()=>{setAnalProd(p.nombre);setAnalBusq(p.nombre);}}
                      ><span>{p.nombre}</span><span style={{color:C.accent,fontSize:11}}>{fmt(p.precio)} actual</span></div>)}
                    </div>}
                  </div>
                  <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={analDesde} onChange={e=>setAnalDesde(e.target.value)}/></div>
                  <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={analHasta} onChange={e=>setAnalHasta(e.target.value)}/></div>
                  <div style={{display:"flex",alignItems:"flex-end",gap:6}}>
                    <button style={css.btn("neutral")} onClick={()=>{setAnalDesde("");setAnalHasta("");}}>✕ Limpiar fechas</button>
                  </div>
                </div>
              </div>

              {!analProd
                ? <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
                    <div style={{fontSize:32,marginBottom:12}}>🔍</div>
                    <div style={{fontSize:14}}>Buscá un producto para ver su historial de ventas</div>
                  </div>
                : historial.length===0
                  ? <div style={{textAlign:"center",padding:"32px",color:C.muted}}>Sin ventas del producto en el período seleccionado.</div>
                  : <>
                    {/* Stats resumen */}
                    <div style={{...css.grid(130),marginBottom:16}}>
                      <div style={css.stat}><div style={{...css.statV(C.accent),fontSize:22}}>{totalUnidades}</div><div style={css.statL}>Unidades vendidas</div></div>
                      <div style={css.stat}><div style={css.statV()}>{historial.length}</div><div style={css.statL}>Veces en facturas</div></div>
                      <div style={css.stat}><div style={{...css.statV(C.success),fontSize:16}}>{fmt(precioMin)}</div><div style={css.statL}>Precio mínimo cobrado</div></div>
                      <div style={css.stat}><div style={{...css.statV(C.danger),fontSize:16}}>{fmt(precioMax)}</div><div style={css.statL}>Precio máximo cobrado</div></div>
                      <div style={css.stat}><div style={{...css.statV(),fontSize:16}}>{fmt(precioPromedio)}</div><div style={css.statL}>Precio promedio</div></div>
                      <div style={css.stat}><div style={{...css.statV(C.info),fontSize:16}}>{fmt(precioActual)}</div><div style={css.statL}>Precio de lista actual</div></div>
                    </div>

                    {/* Historial de precios */}
                    {histPrecios.length>1&&<>
                      <div style={{fontWeight:700,fontSize:13,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>💰 Historial de precios cobrados</div>
                      <div style={{overflowX:"auto",marginBottom:16}}><table style={css.table}>
                        <thead><tr>
                          <th style={css.th}>Precio cobrado</th>
                          <th style={{...css.th,textAlign:"right"}}>Veces</th>
                          <th style={{...css.th,textAlign:"right"}}>Unidades</th>
                          <th style={css.th}>Primera vez</th>
                          <th style={css.th}>Última vez</th>
                          <th style={css.th}>Vs. lista actual</th>
                        </tr></thead>
                        <tbody>{histPrecios.map(hp=>{
                          const diff = hp.precio - precioActual;
                          const pct = precioActual>0?Math.round(diff/precioActual*100):0;
                          return <tr key={hp.precio}>
                            <td style={{...css.td,fontWeight:800,fontSize:15,color:C.accent}}>{fmt(hp.precio)}</td>
                            <td style={{...css.td,textAlign:"right"}}>{hp.veces}</td>
                            <td style={{...css.td,textAlign:"right",fontWeight:700}}>{hp.unidades}</td>
                            <td style={css.td}>{fmtFecha(hp.primera)}</td>
                            <td style={css.td}>{fmtFecha(hp.ultima)}</td>
                            <td style={css.td}>
                              {diff===0
                                ? <span style={{color:C.muted}}>= Lista actual</span>
                                : <span style={{color:diff>0?C.success:C.danger,fontWeight:700}}>
                                    {diff>0?"+":""}{fmt(diff)} ({diff>0?"+":""}{pct}%)
                                  </span>}
                            </td>
                          </tr>;
                        })}</tbody>
                      </table></div>
                    </>}

                    {/* Historial factura a factura */}
                    <div style={{fontWeight:700,fontSize:13,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>📋 Detalle por factura</div>
                    <div style={{overflowX:"auto"}}><table style={css.table}>
                      <thead><tr>
                        <th style={css.th}>Fecha</th>
                        <th style={css.th}>N° Fact.</th>
                        <th style={css.th}>Comanda</th>
                        <th style={css.th}>Vendedor</th>
                        <th style={css.th}>Cliente</th>
                        <th style={{...css.th,textAlign:"right"}}>Cant.</th>
                        <th style={{...css.th,textAlign:"right"}}>Precio cobrado</th>
                        <th style={{...css.th,textAlign:"right"}}>Vs. lista</th>
                      </tr></thead>
                      <tbody>{historial.map((h,i)=>{
                        const diff = h.precio - precioActual;
                        return <tr key={i} style={{background:diff<0?"#7f1d1d11":diff>0?"#14532d11":"transparent"}}>
                          <td style={css.td}>{fmtFecha(h.fecha)}</td>
                          <td style={{...css.td,color:C.accent,fontWeight:700}}>#{h.numero}</td>
                          <td style={css.td}>{h.comanda!=="—"?`#${h.comanda}`:"—"}</td>
                          <td style={css.td}>{h.vendedor||"—"}</td>
                          <td style={css.td}>{h.cliente}</td>
                          <td style={{...css.td,textAlign:"right",fontWeight:700}}>{h.qty}</td>
                          <td style={{...css.td,textAlign:"right",fontWeight:700,color:C.accent}}>{fmt(h.precio)}</td>
                          <td style={css.td}>
                            {diff===0
                              ? <span style={{color:C.muted,fontSize:11}}>= lista</span>
                              : <span style={{color:diff>0?C.success:C.danger,fontWeight:700,fontSize:11}}>
                                  {diff>0?"+":""}{fmt(diff)}
                                </span>}
                          </td>
                        </tr>;
                      })}</tbody>
                      <tfoot><tr style={{background:"#111",borderTop:`2px solid ${C.accent}`}}>
                        <td colSpan={5} style={{...css.td,fontWeight:900,color:C.accent}}>TOTAL</td>
                        <td style={{...css.td,textAlign:"right",fontWeight:900,color:C.accent,fontSize:16}}>{totalUnidades}</td>
                        <td colSpan={2} style={css.td}></td>
                      </tr></tfoot>
                    </table></div>
                  </>
              }
            </div>;
          })()}
        </>}

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
          <table style={css.table}><thead><tr><th style={css.th}>Nombre</th><th style={css.th}>Apellido</th><th style={css.th}>Teléfono</th><th style={css.th}>Dirección</th><th style={css.th}></th>{esAdmin&&<th style={css.th}></th>}</tr></thead>
            <tbody>{cf.map(c=><tr key={c.id}><td style={{...css.td,fontWeight:600}}>{c.nombre}</td><td style={css.td}>{c.apellido||"—"}</td><td style={css.td}>{c.telefono||"—"}</td><td style={css.td}>{c.direccion||"—"}</td>
              <td style={css.td}><button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={()=>{setClienteHistorial(c);setChDesde("");setChHasta("");}}>📊 Historial</button></td>
              {esAdmin&&<td style={css.td}><button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={async()=>{if(window.confirm("¿Eliminar?")){await supabase.from("clientes").delete().eq("id",c.id);setClientes(prev=>prev.filter(x=>x.id!==c.id));}}}>🗑</button></td>}
            </tr>)}</tbody>
          </table>
        </div>}

        {/* ══ COMPRAS ══ */}
        {tab==="compras"&&(esCompras||esAdmin)&&<>
          {comprasVencidas.length>0&&<div style={{...css.card,border:`1px solid ${C.danger}`,background:"#7f1d1d22",marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:C.danger,marginBottom:8}}>⚠️ {comprasVencidas.length} CC con más de {DIAS_ALERTA} días sin pagar</div>{comprasVencidas.slice(0,5).map(c=><div key={c.id} style={{fontSize:12,color:C.muted,marginBottom:3}}>• {c.proveedor} — {fmt(c.total)} — Fact. {c.nroFactura||"s/n"} — {diasDesde(c.fecha)} días</div>)}</div>}
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {[{k:"nueva",l:"📋 Nueva Compra"},{k:"historial",l:"🗂 Historial"},{k:"pagos",l:"💳 Pagar Proveedor"},{k:"cheques",l:"🏦 Cheques"},{k:"productosCompra",l:"📦 Artículos"},{k:"estadocuenta",l:"📊 Estado de Cuentas"}].map(t=>(
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
                      {proveedores.filter(p=>p.toLowerCase().includes(ncBusqProv.toLowerCase())).length===0&&(<div style={{padding:"8px 12px",fontSize:12}}><span style={{color:C.muted}}>No existe — </span><span style={{color:C.accent,cursor:"pointer",fontWeight:700}} onClick={()=>{setProveedores(prev=>[...prev,ncBusqProv]);setNc(p=>({...p,proveedor:ncBusqProv}));}}>+ Agregar "{ncBusqProv}"</span></div>)}
                    </div>
                  )}
                </div>
                <div style={{...css.col,maxWidth:150}}><div style={css.lbl}>N° Factura</div><input style={css.input} placeholder="Ej: A-0001" value={nc.nroFactura} onChange={e=>setNc(p=>({...p,nroFactura:e.target.value}))}/></div>
                <div style={css.col}><div style={css.lbl}>Tipo</div><select style={css.sel} value={nc.tipoFactura} onChange={e=>setNc(p=>({...p,tipoFactura:e.target.value}))}>{TIPOS_FACTURA_COMPRA.map(t=><option key={t}>{t}</option>)}</select></div>
                <div style={css.col}><div style={css.lbl}>Forma de Pago</div><select style={css.sel} value={nc.formaPago} onChange={e=>setNc(p=>({...p,formaPago:e.target.value}))}>{FORMAS_PAGO_COMPRA.map(t=><option key={t}>{t}</option>)}</select></div>
                {nc.formaPago==="Cheque"&&<>
                  <div style={css.col}><div style={css.lbl}>N° Cheque</div><input style={css.input} placeholder="Ej: 00123456" value={nc.numeroCheque||""} onChange={e=>setNc(p=>({...p,numeroCheque:e.target.value}))}/></div>
                  <div style={css.col}><div style={css.lbl}>Banco</div><input style={css.input} placeholder="Ej: Banco Nación" value={nc.bancoCheque||""} onChange={e=>setNc(p=>({...p,bancoCheque:e.target.value}))}/></div>
                  <div style={css.col}><div style={css.lbl}>Fecha de pago del cheque</div><input style={css.input} type="date" value={nc.fechaPagoCheque||""} onChange={e=>setNc(p=>({...p,fechaPagoCheque:e.target.value}))}/></div>
                </>}
                {nc.formaPago==="Cuenta Corriente"&&<div style={{background:"#1a1a0a",border:"1px solid #f59e0b",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#f59e0b",marginTop:4}}>⚠️ Esta compra quedará como deuda pendiente con el proveedor</div>}
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
  const nombre = ncBusqArt.trim();
  const id = gid();
  await supabase.from("articulos_compra").insert({id,nombre,categoria:"Mercadería",activo:true}).then(r=>{if(r.error)console.error(r.error);});
  const na={nombre,categoria:"Mercadería",unidad:"",activo:true,ultimoPrecio:0};
  setArticulosCompra(prev=>[...prev,na].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es")));
  setNcSelArt(nombre);
}}>+ Agregar "{ncBusqArt}" como nuevo artículo</span></div>)}
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
              <div style={{overflowX:"auto"}}><table style={css.table}><thead><tr><th style={css.th}>N°</th><th style={css.th}>Fecha</th><th style={css.th}>Proveedor</th><th style={css.th}>N° Fact.</th><th style={css.th}>Tipo</th><th style={css.th}>Pago</th><th style={css.th}>Total</th><th style={css.th}>Estado</th><th style={css.th}>Días</th></tr></thead>
                <tbody>{comprasFiltradas.map(c=><tr key={c.id} style={{background:comprasVencidas.find(x=>x.id===c.id)?"#7f1d1d22":"transparent"}}>
                  <td style={{...css.td,color:C.accent,fontWeight:700}}>{c.numero}</td><td style={css.td}>{c.fecha}</td><td style={{...css.td,fontWeight:600}}>{c.proveedor}</td><td style={css.td}>{c.nroFactura||"—"}</td>
                  <td style={css.td}><span style={css.tag(C.info)}>{c.tipoFactura}</span></td><td style={css.td}><span style={css.tag(c.formaPago==="Cuenta corriente"?C.warn:C.success)}>{c.formaPago}</span></td>
                  <td style={{...css.td,fontWeight:700}}>{fmt(c.total)}</td><td style={css.td}><span style={{...css.badge(c.estado==="pagada"?"pagada":"pendiente")}}>{c.estado==="pagada"?"✅ Pagada":c.estado==="parcial"?"💰 Parcial":"⏳ Pendiente"}</span></td>
                  <td style={{...css.td,color:diasDesde(c.fecha)>DIAS_ALERTA&&c.formaPago==="Cuenta corriente"?C.danger:C.muted}}>{diasDesde(c.fecha)}d</td>
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

          {comprasTab==="cheques"&&(()=>{
            const hoy5 = new Date(); hoy5.setDate(hoy5.getDate()+5);
            const hoy5str = hoy5.toISOString().slice(0,10);
            const chPendientes = cheques.filter(ch=>ch.estado==="pendiente");
            const chPorVencer = chPendientes.filter(ch=>ch.fechaPago<=hoy5str);
            const chVencidos = chPendientes.filter(ch=>ch.fechaPago<hoy());
            return <>
              {chPorVencer.length>0&&<div style={{...css.card,border:`1px solid ${C.danger}`,background:"#7f1d1d22",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:C.danger,marginBottom:8}}>⚠️ {chPorVencer.length} cheque{chPorVencer.length>1?"s":""} por vencer en los próximos 5 días</div>
                {chPorVencer.map(ch=><div key={ch.id} style={{fontSize:12,color:C.muted,marginBottom:3}}>
                  • {ch.proveedor} — {fmt(ch.monto)} — vence {ch.fechaPago} {ch.numero?"· N° "+ch.numero:""}
                </div>)}
              </div>}

              <div style={css.card}>
                <div style={css.cardTitle}>🏦 Registro de Cheques Emitidos</div>
                <div style={{...css.row,marginBottom:12}}>
                  <button style={{...css.btn(chequesTab==="lista"?"primary":"neutral"),fontSize:12}} onClick={()=>setChequesTab("lista")}>📋 Listado</button>
                  <button style={{...css.btn(chequesTab==="nuevo"?"primary":"neutral"),fontSize:12}} onClick={()=>setChequesTab("nuevo")}>➕ Nuevo Cheque</button>
                </div>

                {chequesTab==="nuevo"&&<>
                  <div style={css.row}>
                    <div style={css.col}><div style={css.lbl}>Proveedor</div><input style={css.input} placeholder="Nombre del proveedor" value={nCheque.proveedor} onChange={e=>setNCheque(p=>({...p,proveedor:e.target.value}))}/></div>
                    <div style={css.col}><div style={css.lbl}>Monto</div><input style={css.input} type="number" placeholder="0" value={nCheque.monto} onChange={e=>setNCheque(p=>({...p,monto:e.target.value}))}/></div>
                    <div style={css.col}><div style={css.lbl}>N° Cheque</div><input style={css.input} placeholder="Ej: 00123456" value={nCheque.numero} onChange={e=>setNCheque(p=>({...p,numero:e.target.value}))}/></div>
                    <div style={css.col}><div style={css.lbl}>Banco</div><input style={css.input} placeholder="Ej: Banco Nación" value={nCheque.banco} onChange={e=>setNCheque(p=>({...p,banco:e.target.value}))}/></div>
                  </div>
                  <div style={css.row}>
                    <div style={css.col}><div style={css.lbl}>Fecha de Emisión</div><input style={css.input} type="date" value={nCheque.fechaEmision} onChange={e=>setNCheque(p=>({...p,fechaEmision:e.target.value}))}/></div>
                    <div style={css.col}><div style={css.lbl}>Fecha de Pago</div><input style={css.input} type="date" value={nCheque.fechaPago} onChange={e=>setNCheque(p=>({...p,fechaPago:e.target.value}))}/></div>
                    <div style={{flex:2}}><div style={css.lbl}>Observaciones</div><input style={css.input} placeholder="Opcional..." value={nCheque.obs} onChange={e=>setNCheque(p=>({...p,obs:e.target.value}))}/></div>
                  </div>
                  <div style={{textAlign:"right",marginTop:8}}>
                    <button style={css.btn()} onClick={async()=>{
                      if(!nCheque.proveedor||!nCheque.monto||!nCheque.fechaPago) return alert("Completá proveedor, monto y fecha de pago");
                      const id = gid();
                      await supabase.from("cheques").insert({id,proveedor:nCheque.proveedor,monto:parseFloat(nCheque.monto)||0,fecha_emision:nCheque.fechaEmision,fecha_pago:nCheque.fechaPago,estado:"pendiente",banco:nCheque.banco,numero:nCheque.numero,obs:nCheque.obs});
                      setCheques(prev=>[{id,compraId:null,proveedor:nCheque.proveedor,monto:parseFloat(nCheque.monto)||0,fechaEmision:nCheque.fechaEmision,fechaPago:nCheque.fechaPago,estado:"pendiente",banco:nCheque.banco,numero:nCheque.numero,obs:nCheque.obs},...prev]);
                      setNCheque({proveedor:"",monto:"",fechaEmision:hoy(),fechaPago:"",banco:"",numero:"",obs:""});
                      setChequesTab("lista");
                    }}>💾 Guardar Cheque</button>
                  </div>
                </>}

                {chequesTab==="lista"&&<div style={{overflowX:"auto"}}><table style={css.table}>
                    <thead><tr>
                      <th style={css.th}>Proveedor</th>
                      <th style={css.th}>N° Cheque</th>
                      <th style={css.th}>Banco</th>
                      <th style={css.th}>Emisión</th>
                      <th style={css.th}>Fecha Pago</th>
                      <th style={css.th}>Monto</th>
                      <th style={css.th}>Estado</th>
                      <th style={css.th}></th>
                    </tr></thead>
                    <tbody>{cheques.sort((a,b)=>a.fechaPago.localeCompare(b.fechaPago)).map(ch=>{
                      const vencido = ch.estado==="pendiente"&&ch.fechaPago<hoy();
                      const porVencer = ch.estado==="pendiente"&&ch.fechaPago<=hoy5str&&ch.fechaPago>=hoy();
                      return <tr key={ch.id} style={{background:vencido?"#7f1d1d22":porVencer?"#713f1222":"transparent"}}>
                        <td style={{...css.td,fontWeight:600}}>{ch.proveedor}</td>
                        <td style={css.td}>{ch.numero||"—"}</td>
                        <td style={css.td}>{ch.banco||"—"}</td>
                        <td style={css.td}>{ch.fechaEmision}</td>
                        <td style={{...css.td,color:vencido?C.danger:porVencer?C.warn:C.text,fontWeight:700}}>{ch.fechaPago}</td>
                        <td style={{...css.td,fontWeight:700,color:C.accent}}>{fmt(ch.monto)}</td>
                        <td style={css.td}>
                          {ch.estado==="pagado"
                            ?<span style={css.tag(C.success)}>✅ Pagado</span>
                            :vencido?<span style={css.tag(C.danger)}>❌ Vencido</span>
                            :porVencer?<span style={css.tag(C.warn)}>⚠️ Por vencer</span>
                            :<span style={css.tag(C.info)}>⏳ Pendiente</span>}
                        </td>
                        <td style={css.td}>
                          {ch.estado==="pendiente"&&<button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={async()=>{
                            await supabase.from("cheques").update({estado:"pagado"}).eq("id",ch.id);
                            setCheques(prev=>prev.map(x=>x.id===ch.id?{...x,estado:"pagado"}:x));
                          }}>✓ Marcar pagado</button>}
                        </td>
                      </tr>;
                    })}</tbody>
                  </table></div>}
              </div>
            </>;
          })()}

          {comprasTab==="productosCompra"&&(()=>{
            // Stats por artículo calculadas desde compras cargadas
            const statsArt = {};
            compras.forEach(comp=>{
              (comp.items||[]).forEach(i=>{
                if(!i.nombre) return;
                if(!statsArt[i.nombre]) statsArt[i.nombre]={veces:0,ultimaFecha:"",ultimoPrecio:0,ultimoProveedor:""};
                statsArt[i.nombre].veces++;
                if(!statsArt[i.nombre].ultimaFecha||comp.fecha>statsArt[i.nombre].ultimaFecha){
                  statsArt[i.nombre].ultimaFecha = comp.fecha;
                  statsArt[i.nombre].ultimoPrecio = parseFloat(i.precio)||0;
                  statsArt[i.nombre].ultimoProveedor = comp.proveedor;
                }
              });
            });

            const artsFiltrados = articulosCompra
              .filter(a=>!ncBusqArt||a.nombre.toLowerCase().includes(ncBusqArt.toLowerCase()))
              .sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"));

            return <>
              <div style={css.card}>
                <div style={css.cardTitle}>📦 Artículos de Compra</div>
                <div style={css.row}>
                  <div style={{flex:2}}>
                    <input style={css.input} placeholder="Buscar artículo..." value={ncBusqArt} onChange={e=>setNcBusqArt(e.target.value)}/>
                  </div>
                  <div style={{display:"flex",alignItems:"flex-end"}}>
                    <button style={css.btn("neutral")} onClick={()=>setNcBusqArt("")}>✕</button>
                  </div>
                </div>
                <div style={{fontSize:12,color:C.muted,marginTop:4}}>{articulosCompra.length} artículos registrados · mostrando {artsFiltrados.length}</div>
              </div>

              <div style={css.card}>
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr>
                    <th style={css.th}>Artículo</th>
                    <th style={css.th}>Último costo</th>
                    <th style={css.th}>Última compra</th>
                    <th style={css.th}>Proveedor</th>
                    <th style={{...css.th,textAlign:"right"}}>Veces comprado</th>
                    {esAdmin&&<th style={css.th}></th>}
                  </tr></thead>
                  <tbody>{artsFiltrados.map(a=>{
                    const st = statsArt[a.nombre]||{veces:0,ultimaFecha:"",ultimoPrecio:0,ultimoProveedor:""};
                    const ultimoPrecio = st.ultimoPrecio||a.ultimoPrecio||0;
                    return <tr key={a.nombre}>
                      <td style={{...css.td,fontWeight:600}}>{a.nombre}</td>
                      <td style={{...css.td,fontWeight:700,color:C.accent}}>{ultimoPrecio>0?fmt(ultimoPrecio):"—"}</td>
                      <td style={css.td}>{st.ultimaFecha?fmtFecha(st.ultimaFecha):"—"}</td>
                      <td style={{...css.td,fontSize:12,color:C.muted}}>{st.ultimoProveedor||"—"}</td>
                      <td style={{...css.td,textAlign:"right",fontWeight:700}}>{st.veces||0}</td>
                      {esAdmin&&<td style={css.td}>
                        <button style={{...css.btn("warn"),padding:"4px 8px",fontSize:10}} onClick={()=>{
                          const nuevo = window.prompt("Nuevo nombre para \""+a.nombre+"\":", a.nombre);
                          if(!nuevo||nuevo.trim()===a.nombre) return;
                          const nombreNuevo = nuevo.trim();
                          supabase.from("articulos_compra").update({nombre:nombreNuevo}).eq("nombre",a.nombre)
                            .then(()=>setArticulosCompra(prev=>prev.map(x=>x.nombre===a.nombre?{...x,nombre:nombreNuevo}:x)));
                        }}>✏️</button>
                      </td>}
                    </tr>;
                  })}</tbody>
                </table></div>
              </div>
            </>;
          })()}

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
                <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                  <button style={{...css.btn(horaEditId?"warn":"primary"),opacity:(!horaEmpId||!horaEntrada||!horaSalida)?0.4:1}} onClick={guardarHoras} disabled={!horaEmpId||!horaEntrada||!horaSalida}>
                    {horaEditId?"💾 Guardar cambios":"✅ Registrar"}
                  </button>
                  {horaEditId&&<button style={css.btn("neutral")} onClick={()=>{setHoraEditId(null);setHoraEmpId("");setHoraEntrada("");setHoraSalida("");setHoraObs("");}}>✕ Cancelar</button>}
                </div>
              </div>
            </div>
            <div style={css.card}><div style={css.cardTitle}>📋 Historial de Turnos</div>
              {horasTrabajo.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px"}}>Sin registros.</p>:
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  {/* Filtros del historial de horas */}
                  <div style={{background:"#111",borderRadius:9,padding:10,marginBottom:10}}>
                    <div style={css.row}>
                      <div style={css.col}><div style={css.lbl}>Empleado</div>
                        <select style={css.sel} value={filtHoraEmp} onChange={e=>setFiltHoraEmp(e.target.value)}>
                          <option value="">— Todos —</option>
                          {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                      </div>
                      <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={filtHoraDesde} onChange={e=>setFiltHoraDesde(e.target.value)}/></div>
                      <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={filtHoraHasta} onChange={e=>setFiltHoraHasta(e.target.value)}/></div>
                      <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setFiltHoraEmp("");setFiltHoraDesde("");setFiltHoraHasta("");}}>✕ Limpiar</button></div>
                    </div>
                  </div>
                  <thead><tr><th style={css.th}>Empleado</th><th style={css.th}>Fecha</th><th style={css.th}>Turno</th><th style={{...css.th,color:C.success}}>Entrada</th><th style={{...css.th,color:C.danger}}>Salida</th><th style={css.th}>Horas</th><th style={css.th}>Subtotal</th><th style={css.th}>Obs.</th>{esAdmin&&<th style={css.th}></th>}</tr></thead>
                  <tbody>{horasTrabajo.filter(h=>(!filtHoraEmp||h.empleadoId===filtHoraEmp)&&(!filtHoraDesde||h.fecha>=filtHoraDesde)&&(!filtHoraHasta||h.fecha<=filtHoraHasta)).sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(h=>{
                    const emp=empleados.find(e=>e.id===h.empleadoId);
                    return <tr key={h.id} style={{background:horaEditId===h.id?"#1a2a1a":"transparent"}}>
                      <td style={{...css.td,fontWeight:600}}>{emp?.nombre||"—"}</td>
                      <td style={css.td}>{fmtFecha(h.fecha)}</td>
                      <td style={css.td}><span style={css.tag(C.info)}>{h.turno||"—"}</span></td>
                      <td style={{...css.td,color:C.success,fontWeight:700}}>{h.horaEntrada||"—"}</td>
                      <td style={{...css.td,color:C.danger,fontWeight:700}}>{h.horaSalida||"—"}</td>
                      <td style={css.td}><span style={{fontWeight:800,color:C.accent}}>{h.horas}hs</span></td>
                      <td style={css.td}>{emp&&emp.valorHora>0?fmt(h.horas*emp.valorHora):"—"}</td>
                      <td style={{...css.td,color:C.muted,fontSize:11}}>{h.obs||"—"}</td>
                      {esAdmin&&<td style={css.td}><div style={{display:"flex",gap:4}}>
                        <button style={{...css.btn("warn"),padding:"4px 8px",fontSize:10}} onClick={()=>{setHoraEditId(h.id);setHoraEmpId(h.empleadoId);setHoraFecha(h.fecha);setHoraTurno(h.turno||"Noche");setHoraEntrada(h.horaEntrada||"");setHoraSalida(h.horaSalida||"");setHoraObs(h.obs||"");}}>✏️</button>
                        <button style={{...css.btn("danger"),padding:"4px 8px",fontSize:10}} onClick={()=>{if(window.confirm("¿Eliminar este registro?"))eliminarHoras(h.id);}}>🗑</button>
                      </div></td>}
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

          {personalTab==="resumen"&&esAdmin&&<>
            <div style={css.card}><div style={css.cardTitle}>📊 Resumen por Empleado</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Período desde</div><input style={css.input} type="date" value={reciboDesde} onChange={e=>setReciboDesde(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Período hasta</div><input style={css.input} type="date" value={reciboHasta} onChange={e=>setReciboHasta(e.target.value)}/></div>
              </div>
              {empleados.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px"}}>No hay empleados.</p>:
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr><th style={css.th}>Empleado</th><th style={css.th}>Rol</th><th style={css.th}>Horas</th><th style={css.th}>Bruto</th><th style={css.th}>Consumos</th><th style={css.th}>Adelantos</th><th style={css.th}>NETO</th><th style={css.th}>Recibo</th></tr></thead>
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

        {/* ══ MODAL DETALLE FACTURA ══ */}
        {/* ══ MODAL AUTORIZACIÓN PIN ══ */}
        {modalAutorizacion&&<div style={css.modal}>
          <div style={{...css.modalBox,maxWidth:420,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:8}}>🔒</div>
            <div style={{fontWeight:900,fontSize:18,color:C.danger,marginBottom:4}}>TURNO BLOQUEADO</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Se detectó una diferencia en la correlatividad de comandas.</div>

            <div style={{background:"#1a1a0a",border:"1px solid #f59e0b",borderRadius:8,padding:"14px 16px",marginBottom:16,textAlign:"left"}}>
              <div style={{fontSize:12,color:"#f59e0b",fontWeight:700,marginBottom:8}}>⚠️ DETALLE DE LA IRREGULARIDAD</div>
              <div style={{fontSize:13}}>Vendedor: <b>{modalAutorizacion.vend}</b></div>
              <div style={{fontSize:13}}>Turno: <b>{modalAutorizacion.turn} — {modalAutorizacion.fecha}</b></div>
              <div style={{fontSize:13}}>Última comanda registrada: <b>#{modalAutorizacion.ultimaNum||"ninguna"}</b></div>
              <div style={{fontSize:13}}>Comanda que intenta ingresar: <b style={{color:C.danger}}>#{modalAutorizacion.comandaNum}</b></div>
              <div style={{fontSize:13}}>Diferencia: <b style={{color:C.danger}}>{modalAutorizacion.diferencia} comanda(s)</b></div>
            </div>

            <div style={{background:"#111",borderRadius:8,padding:"14px 16px",marginBottom:16}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:4}}>¿Es un cambio de talonario o situación conocida?</div>
              <div style={{fontSize:13,color:C.text,marginBottom:12}}>Si es un talonario nuevo, ingresá el primer y último número. Si es otra situación, dejá en blanco.</div>
              <div style={css.row}>
                <div style={css.col}>
                  <div style={css.lbl}>N° desde (primer comanda)</div>
                  <input style={css.input} type="number" placeholder="Ej: 3081001" value={talDesde} onChange={e=>setTalDesde(e.target.value)}/>
                </div>
                <div style={css.col}>
                  <div style={css.lbl}>N° hasta (último comanda)</div>
                  <input style={css.input} type="number" placeholder="Ej: 3081100" value={talHasta} onChange={e=>setTalHasta(e.target.value)}/>
                </div>
              </div>
              <div style={{marginTop:10}}>
                <div style={css.lbl}>Código de autorización del administrador</div>
              <input
                style={{...css.input,textAlign:"center",fontSize:20,letterSpacing:8,fontWeight:700}}
                type="password" maxLength={12} placeholder="••••••••"
                value={pinIngresado}
                onChange={e=>{setPinIngresado(e.target.value);setPinError("");}}
                onKeyDown={async e=>{
                  if(e.key==="Enter"){
                    setPinVerificando(true);
                    const ok = await verificarPin(pinIngresado);
                    setPinVerificando(false);
                    if(ok){
                      const motivo = pinIngresado.length>4?"codigo_maestro":"pin_admin";
                      modalAutorizacion.onAutorizado(motivo);
                      setModalAutorizacion(null);
                      setPinIngresado("");
                      setPinError("");
                    } else {
                      setPinError("❌ Código incorrecto. Solo el administrador puede autorizar.");
                      setPinIngresado("");
                    }
                  }
                }}
                autoFocus
              />
              {pinError&&<div style={{color:C.danger,fontSize:12,marginTop:8,fontWeight:700}}>{pinError}</div>}
            </div>

            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button style={{...css.btn("neutral"),padding:"10px 20px"}} onClick={()=>{setModalAutorizacion(null);setPinIngresado("");setPinError("");}}>✕ Cancelar</button>
              <button style={{...css.btn(),padding:"10px 24px",opacity:(!pinIngresado||pinVerificando)?0.4:1}}
                disabled={!pinIngresado||pinVerificando}
                onClick={async()=>{
                  setPinVerificando(true);
                  const ok = await verificarPin(pinIngresado);
                  setPinVerificando(false);
                  if(ok){
                    const motivo = pinIngresado.length>4?"codigo_maestro":"pin_admin";
                    if(talDesde&&talHasta) {
                      const talId = gid();
                      await supabase.from("talonarios").insert({
                        id:talId, numero_desde:parseInt(talDesde), numero_hasta:parseInt(talHasta),
                        fecha_inicio:modalAutorizacion.fecha, turno_inicio:modalAutorizacion.turn,
                        vendedor:modalAutorizacion.vend, estado:"activo", obs:talObs||"Cambio de talonario autorizado",
                        autorizado_por:motivo
                      });
                      setTalonarios(prev=>[{id:talId,desde:parseInt(talDesde),hasta:parseInt(talHasta),fechaInicio:modalAutorizacion.fecha,turnoInicio:modalAutorizacion.turn,vendedor:modalAutorizacion.vend,estado:"activo",obs:talObs},...prev]);
                      setTalDesde(""); setTalHasta(""); setTalObs("");
                    }
                    modalAutorizacion.onAutorizado(motivo);
                    setModalAutorizacion(null);
                    setPinIngresado("");
                    setPinError("");
                  } else {
                    setPinError("❌ Código incorrecto. Solo el administrador puede autorizar.");
                    setPinIngresado("");
                  }
                }}>
                {pinVerificando?"⏳ Verificando...":"🔓 Autorizar turno"}
              </button>
            </div>

            <div style={{fontSize:11,color:C.muted,marginTop:12}}>
              Este intento queda registrado en el sistema con fecha, hora y vendedor.
            </div>
          </div>
        </div>}

        {/* ══ MODAL COMPROBANTE ══ */}
        {modalComprobante&&<div style={css.modal} onClick={()=>setModalComprobante(null)}>
          <div style={{...css.modalBox,maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:16,color:C.accent,marginBottom:16}}>🖨️ Generar Comprobante</div>
            <div style={{background:"#111",borderRadius:8,padding:12,marginBottom:16}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"1px"}}>Datos del cliente (opcionales)</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Nombre</div><input style={css.input} placeholder="Nombre" value={cmpNombre} onChange={e=>setCmpNombre(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Apellido</div><input style={css.input} placeholder="Apellido" value={cmpApellido} onChange={e=>setCmpApellido(e.target.value)}/></div>
              </div>
              <div style={css.col}><div style={css.lbl}>DNI</div><input style={css.input} placeholder="Número de documento" value={cmpDni} onChange={e=>setCmpDni(e.target.value)}/></div>
            </div>
            <div style={{background:"#111",borderRadius:8,padding:12,marginBottom:16}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"1px"}}>Vista previa del comprobante</div>
              <div style={{background:"#fff",color:"#111",borderRadius:6,padding:"16px",fontSize:12,fontFamily:"Arial,sans-serif"}}>
                <div style={{textAlign:"center",borderBottom:"2px solid #111",paddingBottom:10,marginBottom:10}}>
                  <div style={{fontSize:18,fontWeight:900,letterSpacing:"2px"}}>{datosLocal.nombre}</div>
                  {datosLocal.direccion&&<div style={{fontSize:11,color:"#555",marginTop:2}}>{datosLocal.direccion}</div>}
                  {datosLocal.telefono&&<div style={{fontSize:11,color:"#555"}}>Tel: {datosLocal.telefono}</div>}
                  {datosLocal.instagram&&<div style={{fontSize:11,color:"#555"}}>{datosLocal.instagram}</div>}
                </div>
                <div style={{marginBottom:8,fontSize:11,color:"#555"}}>Fecha: {modalComprobante.fecha}</div>
                {(cmpNombre||cmpApellido||cmpDni)&&<div style={{marginBottom:10,padding:"6px 8px",background:"#f5f5f5",borderRadius:4}}>
                  {(cmpNombre||cmpApellido)&&<div style={{fontWeight:600}}>Cliente: {cmpNombre} {cmpApellido}</div>}
                  {cmpDni&&<div style={{fontSize:11,color:"#555"}}>DNI: {cmpDni}</div>}
                </div>}
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:8}}>
                  <thead><tr style={{borderBottom:"1px solid #ccc"}}>
                    <th style={{textAlign:"left",padding:"4px 2px",fontSize:11,color:"#555"}}>Descripción</th>
                    <th style={{textAlign:"center",padding:"4px 2px",fontSize:11,color:"#555"}}>Cant.</th>
                    <th style={{textAlign:"right",padding:"4px 2px",fontSize:11,color:"#555"}}>Subtotal</th>
                  </tr></thead>
                  <tbody>{(modalComprobante.items||[]).map((it,i)=><tr key={i} style={{borderBottom:"1px solid #eee"}}>
                    <td style={{padding:"5px 2px",fontWeight:500}}>{it.nombre}</td>
                    <td style={{padding:"5px 2px",textAlign:"center"}}>{it.qty}</td>
                    <td style={{padding:"5px 2px",textAlign:"right",fontWeight:600}}>{fmt(it.precio*it.qty)}</td>
                  </tr>)}</tbody>
                </table>
                <div style={{borderTop:"2px solid #111",paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:700,fontSize:13}}>TOTAL</span>
                  <span style={{fontWeight:900,fontSize:18}}>{fmt(modalComprobante.total)}</span>
                </div>
                {datosLocal.telefono&&<div style={{textAlign:"center",marginTop:10,fontSize:10,color:"#888",borderTop:"1px dashed #ccc",paddingTop:8}}>¡Gracias por su compra! · {datosLocal.telefono}</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button style={css.btn("neutral")} onClick={()=>setModalComprobante(null)}>Cancelar</button>
              <button style={css.btn()} onClick={()=>{
                const w = window.open("","_blank","width=420,height=600");
                if(!w){alert("Permitir ventanas emergentes");return;}
                const filas = (modalComprobante.items||[]).map(it=>"<tr><td style='padding:6px 4px;border-bottom:1px solid #eee;font-size:13px'>"+it.nombre+"</td><td style='padding:6px 4px;border-bottom:1px solid #eee;text-align:center;font-size:13px'>"+it.qty+"</td><td style='padding:6px 4px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:600'>"+fmt(it.precio*it.qty)+"</td></tr>").join("");
                let html = "<!DOCTYPE html><html><head><title>Comprobante</title>";
                html += "<style>@media print{body{margin:0}}.no-print{display:none !important}</style>";
                html += "<meta charset='UTF-8'></head><body style='font-family:Arial,sans-serif;padding:24px;max-width:380px;margin:0 auto;color:#111'>";
                html += "<div style='text-align:center;border-bottom:3px solid #111;padding-bottom:14px;margin-bottom:14px'>";
                html += "<div style='font-size:22px;font-weight:900;letter-spacing:3px'>"+datosLocal.nombre+"</div>";
                if(datosLocal.direccion) html += "<div style='font-size:12px;color:#555;margin-top:4px'>"+datosLocal.direccion+"</div>";
                if(datosLocal.telefono) html += "<div style='font-size:12px;color:#555'>Tel: "+datosLocal.telefono+"</div>";
                if(datosLocal.instagram) html += "<div style='font-size:12px;color:#555'>"+datosLocal.instagram+"</div>";
                html += "</div>";
                html += "<div style='font-size:12px;color:#555;margin-bottom:10px'>Fecha: "+modalComprobante.fecha+"</div>";
                if(cmpNombre||cmpApellido||cmpDni){
                  html += "<div style='background:#f5f5f5;border-radius:6px;padding:10px;margin-bottom:14px'>";
                  if(cmpNombre||cmpApellido) html += "<div style='font-weight:700;font-size:14px'>"+cmpNombre+" "+cmpApellido+"</div>";
                  if(cmpDni) html += "<div style='font-size:12px;color:#555'>DNI: "+cmpDni+"</div>";
                  html += "</div>";
                }
                html += "<table style='width:100%;border-collapse:collapse;margin-bottom:12px'>";
                html += "<thead><tr style='border-bottom:2px solid #111'><th style='text-align:left;padding:6px 4px;font-size:11px;color:#777;text-transform:uppercase'>Descripción</th><th style='text-align:center;padding:6px 4px;font-size:11px;color:#777'>Cant.</th><th style='text-align:right;padding:6px 4px;font-size:11px;color:#777'>Subtotal</th></tr></thead>";
                html += "<tbody>"+filas+"</tbody></table>";
                html += "<div style='border-top:3px solid #111;padding-top:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px'>";
                html += "<span style='font-weight:700;font-size:15px'>TOTAL</span><span style='font-weight:900;font-size:22px'>"+fmt(modalComprobante.total)+"</span></div>";
                if(datosLocal.telefono||datosLocal.instagram){
                  html += "<div style='text-align:center;border-top:1px dashed #ccc;padding-top:12px;font-size:11px;color:#888'>¡Gracias por su compra!";
                  if(datosLocal.telefono) html += "<br>"+datosLocal.telefono;
                  if(datosLocal.instagram) html += "<br>"+datosLocal.instagram;
                  html += "</div>";
                }
                html += "<div class='no-print' style='text-align:center;margin-top:20px'><button onclick='window.print()' style='padding:10px 28px;background:#111;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer'>🖨️ Imprimir / Descargar PDF</button></div>";
                html += "</body></html>";
                w.document.write(html);
                w.document.close();
                w.focus();
                setTimeout(()=>w.print(),400);
              }}>🖨️ Imprimir / PDF</button>
            </div>
          </div>
        </div>}

        {factDetalle&&<div style={css.modal} onClick={()=>setFactDetalle(null)}>
          <div style={{...css.modalBox,maxWidth:560,padding:0,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <button style={{position:"absolute",top:16,right:16,...css.btn("neutral"),padding:"4px 10px",zIndex:2}} onClick={()=>setFactDetalle(null)}>✕</button>
            <div style={{background:"#fff",color:"#111",padding:"28px 26px"}}>
              <div style={{textAlign:"center",borderBottom:"2px solid #111",paddingBottom:14,marginBottom:18}}>
                <div style={{fontSize:20,fontWeight:900}}>FOODIES LK</div>
                <div style={{fontSize:11,color:"#666",marginTop:2}}>Comprobante de Venta</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:10,color:"#888",textTransform:"uppercase"}}>N° Factura</div>
                  <div style={{fontSize:22,fontWeight:800}}>#{factDetalle.numero}</div>
                  {factDetalle.comanda!=="—"&&<div style={{fontSize:12,color:"#666",marginTop:2}}>Comanda #{factDetalle.comanda}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"#888",textTransform:"uppercase"}}>Fecha</div>
                  <div style={{fontSize:16,fontWeight:700}}>{factDetalle.fecha}</div>
                  <div style={{fontSize:12,color:"#666"}}>{factDetalle.turno}</div>
                </div>
              </div>
              <div style={{border:"1px solid #ddd",borderRadius:8,padding:"12px 14px",marginBottom:18,background:"#fafafa"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><div style={{fontSize:9,color:"#888",textTransform:"uppercase"}}>Vendedor</div><div style={{fontWeight:700}}>{factDetalle.vendedor}</div></div>
                  <div><div style={{fontSize:9,color:"#888",textTransform:"uppercase"}}>Tipo de venta</div><div style={{fontWeight:600}}>{factDetalle.tipoVenta}</div></div>
                  <div><div style={{fontSize:9,color:"#888",textTransform:"uppercase"}}>Cliente</div><div style={{fontWeight:600}}>{factDetalle.cliente||"—"}</div></div>
                  {factDetalle.cadete&&factDetalle.cadete!=="—"&&<div><div style={{fontSize:9,color:"#888",textTransform:"uppercase"}}>Cadete</div><div style={{fontWeight:600}}>{factDetalle.cadete}</div></div>}
                  <div><div style={{fontSize:9,color:"#888",textTransform:"uppercase"}}>Pago</div><div style={{fontWeight:600}}>{factDetalle.medioPago1}{factDetalle.importe1>0?` — ${fmt(factDetalle.importe1)}`:""}</div></div>
                  {factDetalle.medioPago2&&<div><div style={{fontSize:9,color:"#888",textTransform:"uppercase"}}>Pago 2</div><div style={{fontWeight:600}}>{factDetalle.medioPago2}{factDetalle.importe2>0?` — ${fmt(factDetalle.importe2)}`:""}</div></div>}
                  {factDetalle.notas&&<div style={{gridColumn:"1/-1"}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase"}}>Notas</div><div style={{fontWeight:600,color:"#92400e"}}>{factDetalle.notas}</div></div>}
                </div>
              </div>
              {(!factDetalle.items||factDetalle.items.length===0)?<p style={{color:"#888",textAlign:"center",padding:"16px"}}>Sin ítems registrados.</p>:
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                  <thead><tr style={{borderBottom:"2px solid #111"}}>
                    <th style={{textAlign:"left",padding:"6px 4px",fontSize:10,textTransform:"uppercase",color:"#555"}}>Producto</th>
                    <th style={{textAlign:"right",padding:"6px 4px",fontSize:10,textTransform:"uppercase",color:"#555"}}>Cant.</th>
                    <th style={{textAlign:"right",padding:"6px 4px",fontSize:10,textTransform:"uppercase",color:"#555"}}>Unit.</th>
                    <th style={{textAlign:"right",padding:"6px 4px",fontSize:10,textTransform:"uppercase",color:"#555"}}>Subtotal</th>
                  </tr></thead>
                  <tbody>{factDetalle.items.map((it,i)=><tr key={i} style={{borderBottom:"1px solid #eee"}}>
                    <td style={{padding:"7px 4px",fontWeight:600,fontSize:13}}>{it.nombre}</td>
                    <td style={{padding:"7px 4px",fontSize:13,textAlign:"right"}}>{it.qty}</td>
                    <td style={{padding:"7px 4px",fontSize:13,textAlign:"right"}}>{fmt(it.precio)}</td>
                    <td style={{padding:"7px 4px",fontSize:13,textAlign:"right",fontWeight:700}}>{fmt(it.precio*it.qty)}</td>
                  </tr>)}</tbody>
                </table>}
              <div style={{borderTop:"2px solid #111",marginTop:10,paddingTop:14,display:"flex",justifyContent:"flex-end"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"#888",textTransform:"uppercase"}}>Total</div>
                  <div style={{fontSize:26,fontWeight:900}}>{fmt(factDetalle.total)}</div>
                </div>
              </div>
            </div>
            <div style={{textAlign:"right",padding:"14px 26px",background:"#1a1a1a"}}>
              <button style={{...css.btn(),padding:"10px 24px"}} onClick={()=>{
                const w=window.open("","_blank","width=800,height=600");
                if(!w){alert("Permitir ventanas emergentes");return;}
                const itemsHtml=(factDetalle.items||[]).map(it=>`<tr><td>${it.nombre}</td><td style="text-align:right">${it.qty}</td><td style="text-align:right">${fmt(it.precio)}</td><td style="text-align:right">${fmt(it.precio*it.qty)}</td></tr>`).join("");
                w.document.write(`<!DOCTYPE html><html><head><title>Factura ${factDetalle.numero}</title>
                  <style>body{font-family:Arial,sans-serif;padding:30px;max-width:700px;margin:0 auto}
                  h1{text-align:center}table{width:100%;border-collapse:collapse}
                  th,td{border:1px solid #ccc;padding:8px;font-size:13px}th{background:#f0f0f0}
                  .total{text-align:right;font-size:18px;font-weight:bold;margin-top:16px}</style></head><body>
                  <h1>FOODIES LK — Factura #${factDetalle.numero}</h1>
                  <p>Fecha: ${factDetalle.fecha} · ${factDetalle.turno} · ${factDetalle.tipoVenta}</p>
                  <table><thead><tr><th>Producto</th><th>Cant.</th><th>Unit.</th><th>Subtotal</th></tr></thead>
                  <tbody>${itemsHtml}</tbody></table>
                  <div class="total">TOTAL: ${fmt(factDetalle.total)}</div>
                  </body></html>`);
                w.document.close();w.focus();setTimeout(()=>w.print(),300);
              }}>🖨️ Imprimir / PDF</button>
            </div>
          </div>
        </div>}

        {/* ══ MODAL HISTORIAL CLIENTE ══ */}
        {clienteHistorial&&(()=>{
          const comprasCliente=facturas.filter(f=>f.clienteId===clienteHistorial.id&&(!chDesde||f.fecha>=chDesde)&&(!chHasta||f.fecha<=chHasta)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
          const totalGastado=comprasCliente.reduce((s,f)=>s+f.total,0);
          const ticketProm=comprasCliente.length>0?Math.round(totalGastado/comprasCliente.length):0;
          let frecuenciaTexto="—";
          if(comprasCliente.length>=2){const fechasAsc=[...comprasCliente].map(f=>f.fecha).sort();const diffs=[];for(let i=1;i<fechasAsc.length;i++){const d1=new Date(fechasAsc[i-1]+"T12:00:00");const d2=new Date(fechasAsc[i]+"T12:00:00");diffs.push((d2-d1)/(1000*60*60*24));}const prom=diffs.reduce((s,d)=>s+d,0)/diffs.length;frecuenciaTexto=prom<1?"Varias veces/día":`Cada ${Math.round(prom)} días aprox.`;}
          const ultimaCompra=comprasCliente.length>0?comprasCliente[0].fecha:null;
          const diasUltima=ultimaCompra?Math.floor((new Date()-new Date(ultimaCompra+"T12:00:00"))/(1000*60*60*24)):null;
          return <div style={css.modal} onClick={()=>setClienteHistorial(null)}>
            <div style={css.modalBox} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:800,fontSize:16,color:C.accent}}>📊 {clienteHistorial.nombre} {clienteHistorial.apellido}</div>
                <button style={{...css.btn("neutral"),padding:"4px 10px"}} onClick={()=>setClienteHistorial(null)}>✕</button>
              </div>
              <div style={{background:"#111",borderRadius:9,padding:12,marginBottom:14}}>
                <div style={css.row}>
                  <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={chDesde} onChange={e=>setChDesde(e.target.value)}/></div>
                  <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={chHasta} onChange={e=>setChHasta(e.target.value)}/></div>
                  <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setChDesde("");setChHasta("");}}>✕</button></div>
                </div>
              </div>
              <div style={css.grid(130)}>
                <div style={css.stat}><div style={css.statV()}>{comprasCliente.length}</div><div style={css.statL}>Compras</div></div>
                <div style={css.stat}><div style={css.statV(C.accent)}>{fmt(totalGastado)}</div><div style={css.statL}>Total gastado</div></div>
                <div style={css.stat}><div style={css.statV()}>{fmt(ticketProm)}</div><div style={css.statL}>Ticket prom.</div></div>
                <div style={css.stat}><div style={{...css.statV(C.info),fontSize:13}}>{frecuenciaTexto}</div><div style={css.statL}>Frecuencia</div></div>
              </div>
              {ultimaCompra&&<div style={{background:"#111",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:C.muted}}>Última compra: <b style={{color:C.text}}>{ultimaCompra}</b></span>
                <span style={{fontSize:12,color:diasUltima>30?C.warn:C.success,fontWeight:700}}>{diasUltima===0?"Hoy":`Hace ${diasUltima} días`}</span>
              </div>}
              {comprasCliente.length===0?<p style={{color:C.muted,textAlign:"center",padding:"24px"}}>Sin compras en el período.</p>:
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr><th style={css.th}>Fecha</th><th style={css.th}>N°</th><th style={css.th}>Productos</th><th style={css.th}>Total</th><th style={css.th}></th></tr></thead>
                  <tbody>{comprasCliente.map(f=><tr key={f.id}>
                    <td style={css.td}>{f.fecha}</td>
                    <td style={{...css.td,color:C.accent,fontWeight:700}}>#{f.numero}</td>
                    <td style={css.td}>{f.items&&f.items.length>0?<div style={{fontSize:11,color:C.muted}}>{f.items.map(i=>`${i.qty}× ${i.nombre}`).join(", ")}</div>:"—"}</td>
                    <td style={{...css.td,fontWeight:700}}>{fmt(f.total)}</td>
                    <td style={css.td}><button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={()=>setFactDetalle(f)}>👁</button></td>
                  </tr>)}</tbody>
                </table></div>}
            </div>
          </div>;
        })()}

        {/* ══ CADETES ══ */}
        {tab==="cadetes"&&(()=>{
          const envios=facturas.filter(f=>{
            if(f.tipoVenta!=="Envio") return false;
            if(cadFiltCadete&&f.cadete!==cadFiltCadete) return false;
            if(cadFiltDesde&&f.fecha<cadFiltDesde) return false;
            if(cadFiltHasta&&f.fecha>cadFiltHasta) return false;
            return true;
          }).sort((a,b)=>b.fecha.localeCompare(a.fecha));
          const porCadete={};
          envios.forEach(f=>{const k=f.cadete||"Sin asignar";if(!porCadete[k])porCadete[k]={nombre:k,viajes:[],total:0};porCadete[k].viajes.push(f);porCadete[k].total+=f.total;});
          const grupos=Object.values(porCadete).sort((a,b)=>b.viajes.length-a.viajes.length);
          return <>
            <div style={css.card}>
              <div style={css.cardTitle}>🛵 Registro de Viajes por Cadete</div>
              <div style={{background:"#111",borderRadius:9,padding:12,marginBottom:14}}>
                <div style={css.row}>
                  <div style={css.col}><div style={css.lbl}>Cadete</div>
                    <select style={css.sel} value={cadFiltCadete} onChange={e=>setCadFiltCadete(e.target.value)}>
                      <option value="">— Todos —</option>{cadetes.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={cadFiltDesde} onChange={e=>setCadFiltDesde(e.target.value)}/></div>
                  <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={cadFiltHasta} onChange={e=>setCadFiltHasta(e.target.value)}/></div>
                  <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setCadFiltCadete("");setCadFiltDesde("");setCadFiltHasta("");}}>✕ Limpiar</button></div>
                </div>
              </div>
              {grupos.length>0&&<div style={css.grid(130)}>
                {grupos.map(g=><div key={g.nombre} style={css.stat}>
                  <div style={{fontSize:13,fontWeight:800,color:C.info,marginBottom:4}}>{g.nombre}</div>
                  <div style={css.statV()}>{g.viajes.length} viajes</div>
                  <div style={{fontSize:11,color:C.muted}}>{fmt(g.total)}</div>
                </div>)}
              </div>}
            </div>
            {envios.length===0?<div style={{...css.card,textAlign:"center",padding:"40px",color:C.muted}}>Sin envíos en el período.</div>
              :grupos.map(g=><div key={g.nombre} style={css.card}>
                <div style={{...css.cardTitle,color:C.info,display:"flex",justifyContent:"space-between"}}>
                  <span>🛵 {g.nombre}</span>
                  <span style={{fontSize:12,color:C.muted,fontWeight:400}}>{g.viajes.length} viajes · {fmt(g.total)}</span>
                </div>
                <div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr><th style={css.th}>Fecha</th><th style={css.th}>N°</th><th style={css.th}>Comanda</th><th style={css.th}>Cliente</th><th style={css.th}>Pedido</th><th style={css.th}>Total</th><th style={css.th}></th></tr></thead>
                  <tbody>{g.viajes.map(f=><tr key={f.id}>
                    <td style={css.td}>{f.fecha}</td>
                    <td style={{...css.td,color:C.accent,fontWeight:700}}>#{f.numero}</td>
                    <td style={css.td}>{f.comanda!=="—"?`#${f.comanda}`:"—"}</td>
                    <td style={css.td}>{f.cliente||"—"}</td>
                    <td style={css.td}>{f.items&&f.items.length>0?<div style={{fontSize:11,color:C.muted}}>{f.items.map(i=>`${i.qty}× ${i.nombre}`).join(", ")}</div>:"—"}</td>
                    <td style={{...css.td,fontWeight:700,color:C.success}}>{fmt(f.total)}</td>
                    <td style={css.td}><button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:10}} onClick={()=>setFactDetalle(f)}>👁</button></td>
                  </tr>)}</tbody>
                </table></div>
                <div style={css.total}><div style={{fontSize:10,color:C.muted}}>TOTAL {g.nombre.toUpperCase()}</div><div style={{fontSize:18,fontWeight:800,color:C.success}}>{fmt(g.total)}</div></div>
              </div>)}
          </>;
        })()}

        {/* ══ VENTAS X DÍA ══ */}
        {tab==="ventasxdia"&&esAdmin&&<>
          <div style={css.card}>
            <div style={css.cardTitle}>📅 Ventas por Día</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={vxdFecha} onChange={e=>setVxdFecha(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={vxdHasta} onChange={e=>setVxdHasta(e.target.value)}/></div>
              <div style={css.col}><div style={css.lbl}>Turno</div>
                <select style={css.sel} value={vxdTurno} onChange={e=>setVxdTurno(e.target.value)}>
                  <option value="">— Todos —</option><option>Mañana</option><option>Noche</option>
                </select>
              </div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button style={css.btn("neutral")} onClick={()=>{setVxdFecha("");setVxdHasta("");setVxdTurno("");}}>✕ Limpiar</button></div>
            </div>
          </div>
          {vxdFecha&&(()=>{
            const hasta=vxdHasta||vxdFecha;
            const fechasRango=[];
            let cur=new Date(vxdFecha+"T12:00:00");
            const fin=new Date(hasta+"T12:00:00");
            while(cur<=fin){fechasRango.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1);}
            const turnosFiltro=vxdTurno?[vxdTurno]:["Mañana","Noche"];
            const filas=fechasRango.map(fecha=>{
              const porTurno=turnosFiltro.map(t=>{
                const ff=facturas.filter(f=>f.fecha===fecha&&f.turno===t&&f.estado==="pagada");
                const ef=ff.reduce((s,f)=>s+(f.medioPago1==="Efectivo"?f.importe1:0)+(f.medioPago2==="Efectivo"?f.importe2:0),0);
                const tr=ff.reduce((s,f)=>s+(f.medioPago1==="Transferencia"?f.importe1:0)+(f.medioPago2==="Transferencia"?f.importe2:0),0);
                const cc=ff.reduce((s,f)=>s+(f.medioPago1==="Cuenta Corriente"?f.importe1:0)+(f.medioPago2==="Cuenta Corriente"?f.importe2:0),0);
                const tot=ff.reduce((s,f)=>s+f.total,0);
                return {turno:t,cant:ff.length,ef,tr,cc,tot};
              });
              return {fecha,porTurno,totDia:porTurno.reduce((s,t)=>s+t.tot,0)};
            }).filter(f=>f.totDia>0||fechasRango.length===1);
            const totPeriodo=filas.reduce((s,f)=>s+f.totDia,0);
            const efPeriodo=filas.reduce((s,f)=>s+f.porTurno.reduce((a,t)=>a+t.ef,0),0);
            const trPeriodo=filas.reduce((s,f)=>s+f.porTurno.reduce((a,t)=>a+t.tr,0),0);
            const ccPeriodo=filas.reduce((s,f)=>s+f.porTurno.reduce((a,t)=>a+t.cc,0),0);
            return <div key={vxdFecha+"|"+vxdHasta+"|"+vxdTurno}>
              <div style={css.card}>
                <div style={css.cardTitle}>💰 Resumen del período{vxdTurno?` · Turno ${vxdTurno}`:""}</div>
                <div style={css.grid(140)}>
                  <div style={css.stat}><div style={css.statV(C.accent)}>{fmt(totPeriodo)}</div><div style={css.statL}>TOTAL</div></div>
                  <div style={css.stat}><div style={css.statV(C.success)}>{fmt(efPeriodo)}</div><div style={css.statL}>💵 Efectivo</div></div>
                  <div style={css.stat}><div style={css.statV(C.info)}>{fmt(trPeriodo)}</div><div style={css.statL}>📲 Transferencia</div></div>
                  {ccPeriodo>0&&<div style={css.stat}><div style={css.statV("#a78bfa")}>{fmt(ccPeriodo)}</div><div style={css.statL}>🏦 CC</div></div>}
                  <div style={css.stat}><div style={css.statV()}>{filas.length}</div><div style={css.statL}>Días con ventas</div></div>
                </div>
              </div>
              {filas.length===0?<div style={{...css.card,textAlign:"center",padding:"40px",color:C.muted}}>Sin ventas en el período.</div>
                :<div style={css.card}>
                  <div style={css.cardTitle}>📋 Detalle por Día{vxdTurno?` — Turno ${vxdTurno}`:""}</div>
                  <div style={{overflowX:"auto"}}><table style={css.table}>
                    <thead><tr>
                      <th style={css.th}>Fecha</th>{!vxdTurno&&<th style={css.th}>Turno</th>}
                      <th style={css.th}>Fact.</th><th style={{...css.th,color:C.success}}>Efectivo</th>
                      <th style={{...css.th,color:C.info}}>Transf.</th><th style={{...css.th,color:"#a78bfa"}}>CC</th>
                      <th style={{...css.th,color:C.accent}}>TOTAL</th>
                    </tr></thead>
                    <tbody>
                      {filas.map(fila=>vxdTurno
                        ?fila.porTurno.map(t=><tr key={fila.fecha+t.turno}>
                            <td style={{...css.td,fontWeight:700}}>{fmtFecha(fila.fecha)}</td>
                            <td style={css.td}>{t.cant}</td>
                            <td style={{...css.td,color:C.success,fontWeight:700}}>{t.ef>0?fmt(t.ef):"—"}</td>
                            <td style={{...css.td,color:C.info,fontWeight:700}}>{t.tr>0?fmt(t.tr):"—"}</td>
                            <td style={{...css.td,color:"#a78bfa",fontWeight:700}}>{t.cc>0?fmt(t.cc):"—"}</td>
                            <td style={{...css.td,color:C.accent,fontWeight:800}}>{fmt(t.tot)}</td>
                          </tr>)
                        :fila.porTurno.filter(t=>t.cant>0).map((t,i,arr)=><tr key={fila.fecha+t.turno} style={{borderTop:i===0?`2px solid ${C.border}`:"none"}}>
                            {i===0&&<td style={{...css.td,fontWeight:800,verticalAlign:"middle"}} rowSpan={arr.length}>{fmtFecha(fila.fecha)}</td>}
                            <td style={{...css.td,color:C.muted,fontSize:12}}>{t.turno}</td>
                            <td style={css.td}>{t.cant}</td>
                            <td style={{...css.td,color:C.success,fontWeight:700}}>{t.ef>0?fmt(t.ef):"—"}</td>
                            <td style={{...css.td,color:C.info,fontWeight:700}}>{t.tr>0?fmt(t.tr):"—"}</td>
                            <td style={{...css.td,color:"#a78bfa",fontWeight:700}}>{t.cc>0?fmt(t.cc):"—"}</td>
                            <td style={{...css.td,color:C.accent,fontWeight:800}}>{fmt(t.tot)}</td>
                          </tr>)
                      )}
                      <tr style={{borderTop:`2px solid ${C.accent}`,background:"#111"}}>
                        <td style={{...css.td,fontWeight:900,color:C.accent}} colSpan={vxdTurno?1:2}>TOTAL</td>
                        <td style={css.td}>{filas.reduce((s,f)=>s+f.porTurno.reduce((a,t)=>a+t.cant,0),0)}</td>
                        <td style={{...css.td,color:C.success,fontWeight:900}}>{fmt(efPeriodo)}</td>
                        <td style={{...css.td,color:C.info,fontWeight:900}}>{fmt(trPeriodo)}</td>
                        <td style={{...css.td,color:"#a78bfa",fontWeight:900}}>{ccPeriodo>0?fmt(ccPeriodo):"—"}</td>
                        <td style={{...css.td,color:C.accent,fontWeight:900,fontSize:16}}>{fmt(totPeriodo)}</td>
                      </tr>
                    </tbody>
                  </table></div>
                </div>}
            </div>;
          })()}
        </>}

        {/* ══ REPORTE MENSUAL ══ */}
        {tab==="reportemensual"&&esAdmin&&(()=>{
          const desde=rmDesde||(hoy().slice(0,8)+"01");
          const hasta=rmHasta||hoy();
          const factPeriodo=facturas.filter(f=>f.estado==="pagada"&&f.fecha>=desde&&f.fecha<=hasta);
          const porMes={};
          factPeriodo.forEach(f=>{
            const mes=f.fecha.slice(0,7);
            if(!porMes[mes]) porMes[mes]={mes,facturas:0,total:0,envios:0,ef:0,tr:0,cc:0};
            porMes[mes].facturas++; porMes[mes].total+=f.total;
            if(f.tipoVenta==="Envio") porMes[mes].envios++;
            porMes[mes].ef+=(f.medioPago1==="Efectivo"?f.importe1:0)+(f.medioPago2==="Efectivo"?f.importe2:0);
            porMes[mes].tr+=(f.medioPago1==="Transferencia"?f.importe1:0)+(f.medioPago2==="Transferencia"?f.importe2:0);
            porMes[mes].cc+=(f.medioPago1==="Cuenta Corriente"?f.importe1:0)+(f.medioPago2==="Cuenta Corriente"?f.importe2:0);
          });
          const mesesArr=Object.values(porMes).sort((a,b)=>a.mes.localeCompare(b.mes));
          const prodMap={};
          factPeriodo.forEach(f=>(f.items||[]).forEach(it=>{if(it.nombre==="ENVIO")return;if(!prodMap[it.nombre])prodMap[it.nombre]={qty:0,total:0};prodMap[it.nombre].qty+=it.qty;prodMap[it.nombre].total+=it.qty*it.precio;}));
          const topProductos=Object.entries(prodMap).sort((a,b)=>b[1].total-a[1].total).slice(0,15);
          const totalPeriodo=factPeriodo.reduce((s,f)=>s+f.total,0);
          const totalEnvios=factPeriodo.filter(f=>f.tipoVenta==="Envio").length;

          const generarInforme=()=>{
            const tickets=factPeriodo.length>0?Math.round(totalPeriodo/factPeriodo.length):0;
            const efT=mesesArr.reduce((s,m)=>s+m.ef,0);
            const trT=mesesArr.reduce((s,m)=>s+m.tr,0);
            const ccT=mesesArr.reduce((s,m)=>s+m.cc,0);
            let txt=`INFORME DE VENTAS\nFoodies LK — Período: ${desde} al ${hasta}\n${"=".repeat(50)}\n\n`;
            txt+=`RESUMEN GENERAL\n${"-".repeat(50)}\n`;
            txt+=`Total facturado:        $${totalPeriodo.toLocaleString("es-AR")}\n`;
            txt+=`Cantidad de facturas:   ${factPeriodo.length}\n`;
            txt+=`Ticket promedio:        $${tickets.toLocaleString("es-AR")}\n`;
            txt+=`Cantidad de envíos:     ${totalEnvios}\n`;
            txt+=`Efectivo:               $${efT.toLocaleString("es-AR")}\n`;
            txt+=`Transferencia:          $${trT.toLocaleString("es-AR")}\n`;
            if(ccT>0) txt+=`Cuenta Corriente:       $${ccT.toLocaleString("es-AR")}\n`;
            txt+=`\n`;
            if(mesesArr.length>1){
              txt+=`COMPARATIVA MES A MES\n${"-".repeat(50)}\n`;
              mesesArr.forEach((m,i)=>{
                txt+=`${m.mes}: ${m.facturas} facturas — $${m.total.toLocaleString("es-AR")}`;
                if(i>0){const ant=mesesArr[i-1];const v=ant.total>0?((m.total/ant.total-1)*100):0;txt+=` (${v>=0?"+":""}${v.toFixed(1)}% vs mes anterior)`;}
                txt+=`\n`;
              });
              txt+=`\n`;
            }
            if(topProductos.length>0){
              txt+=`PRODUCTOS MÁS VENDIDOS\n${"-".repeat(50)}\n`;
              topProductos.slice(0,10).forEach(([n,d],i)=>{txt+=`${i+1}. ${n} — ${d.qty} unidades — $${d.total.toLocaleString("es-AR")}\n`;});
              txt+=`\n`;
            }
            txt+=`${"=".repeat(50)}\nInforme generado el ${new Date().toLocaleDateString("es-AR")}\n`;
            setInformeIA(txt);
          };

          return <>
            <div style={css.card}>
              <div style={css.cardTitle}>📈 Reporte Mensual</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>Desde</div><input style={css.input} type="date" value={rmDesde} onChange={e=>setRmDesde(e.target.value)}/></div>
                <div style={css.col}><div style={css.lbl}>Hasta</div><input style={css.input} type="date" value={rmHasta} onChange={e=>setRmHasta(e.target.value)}/></div>
                <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                  <button style={css.btn("neutral")} onClick={()=>{setRmDesde("");setRmHasta("");}}>✕ Limpiar</button>
                  <button style={css.btn()} onClick={generarInforme}>📝 Generar Informe</button>
                </div>
              </div>
              <div style={css.grid(140)}>
                <div style={css.stat}><div style={css.statV(C.accent)}>{fmt(totalPeriodo)}</div><div style={css.statL}>Total período</div></div>
                <div style={css.stat}><div style={css.statV()}>{factPeriodo.length}</div><div style={css.statL}>Facturas</div></div>
                <div style={css.stat}><div style={css.statV(C.info)}>{totalEnvios}</div><div style={css.statL}>🛵 Envíos</div></div>
              </div>
            </div>
            {mesesArr.length>0&&<div style={css.card}>
              <div style={css.cardTitle}>📊 Comparativa Mes a Mes</div>
              <div style={{overflowX:"auto"}}><table style={css.table}>
                <thead><tr><th style={css.th}>Mes</th><th style={css.th}>Facturas</th><th style={css.th}>Total</th><th style={css.th}>Envíos</th><th style={{...css.th,color:C.success}}>Efectivo</th><th style={{...css.th,color:C.info}}>Transf.</th></tr></thead>
                <tbody>{mesesArr.map(m=><tr key={m.mes}><td style={{...css.td,fontWeight:700}}>{m.mes}</td><td style={css.td}>{m.facturas}</td><td style={{...css.td,fontWeight:800,color:C.accent}}>{fmt(m.total)}</td><td style={css.td}>{m.envios}</td><td style={{...css.td,color:C.success}}>{fmt(m.ef)}</td><td style={{...css.td,color:C.info}}>{fmt(m.tr)}</td></tr>)}</tbody>
              </table></div>
            </div>}
            {topProductos.length>0&&<div style={css.card}>
              <div style={css.cardTitle}>⭐ Productos Estrella</div>
              <div style={{overflowX:"auto"}}><table style={css.table}>
                <thead><tr><th style={css.th}>Producto</th><th style={css.th}>Cantidad</th><th style={css.th}>Ingreso</th></tr></thead>
                <tbody>{topProductos.map(([nombre,d])=><tr key={nombre}><td style={{...css.td,fontWeight:600}}>{nombre}</td><td style={css.td}>{d.qty}</td><td style={{...css.td,fontWeight:700,color:C.accent}}>{fmt(d.total)}</td></tr>)}</tbody>
              </table></div>
            </div>}
            {informeIA&&<div style={css.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={css.cardTitle}>📝 Informe Generado</div>
                <button style={{...css.btn(),padding:"8px 16px"}} onClick={()=>{
                  const w=window.open("","_blank","width=850,height=700");
                  if(!w){alert("Permitir ventanas emergentes");return;}
                  w.document.write(`<!DOCTYPE html><html><head><title>Informe</title><style>body{font-family:'Courier New',monospace;padding:30px;white-space:pre-wrap;font-size:13px;line-height:1.5}</style></head><body>${informeIA}</body></html>`);
                  w.document.close();w.focus();
                }}>🖨️ Imprimir</button>
              </div>
              <div style={{background:"#fff",color:"#111",borderRadius:8,padding:"24px 28px",whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.6,maxHeight:500,overflowY:"auto"}}>{informeIA}</div>
            </div>}
          </>;
        })()}

        {/* ══ HISTORIAL GASTOS/RETIROS ══ */}

        {/* ══ MÓDULO STOCK ══ */}
        {tab==="stock"&&esVentas&&(()=>{
          const stokBajo = stock.filter(s=>s.activo&&s.stockActual<=s.stockMinimo&&s.stockMinimo>0);
          const stokNegativo = stock.filter(s=>s.activo&&s.stockActual<0);

          const registrarMovimiento = async (stId, tipo, cantidad, motivo, refId="") => {
            const s = stock.find(x=>x.id===stId);
            if(!s) return;
            const delta = tipo==="salida"?-cantidad:cantidad;
            const nuevoStock = s.stockActual + delta;
            const movId = gid();
            const ahora = new Date();
            const hora = String(ahora.getHours()).padStart(2,"0")+":"+String(ahora.getMinutes()).padStart(2,"0");
            await supabase.from("stock").update({stock_actual:nuevoStock, updated_at:new Date().toISOString()}).eq("id",stId);
            await supabase.from("stock_movimientos").insert({id:movId,stock_id:stId,tipo,cantidad,motivo,referencia_id:refId,fecha:hoy(),hora,usuario:usuario?.nombre||""});
            setStock(prev=>prev.map(x=>x.id===stId?{...x,stockActual:nuevoStock}:x));
            setStockMovs(prev=>[{id:movId,stockId:stId,tipo,cantidad,motivo,referenciaId:refId,fecha:hoy(),hora,usuario:usuario?.nombre||""},...prev]);
          };

          const actualizarMinimo = async (stId, nuevoMin) => {
            await supabase.from("stock").update({stock_minimo:nuevoMin}).eq("id",stId);
            setStock(prev=>prev.map(x=>x.id===stId?{...x,stockMinimo:nuevoMin}:x));
          };

          const categorias = [...new Set(stock.map(s=>s.categoria))].sort();

          return <>
            {/* Alertas */}
            {(stokBajo.length>0||stokNegativo.length>0)&&<div style={{...css.card,border:`2px solid ${C.danger}`,background:"#7f1d1d22",marginBottom:4}}>
              <div style={{fontWeight:800,color:C.danger,marginBottom:8,fontSize:13}}>⚠️ Alerta de stock</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {stokNegativo.map(s=><div key={s.id} style={{background:C.danger,color:"#fff",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:700}}>
                  ❌ {s.nombre}: {s.stockActual} {s.unidad}
                </div>)}
                {stokBajo.filter(s=>s.stockActual>=0).map(s=><div key={s.id} style={{background:"#92400e",color:"#fef3c7",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:700}}>
                  ⚠️ {s.nombre}: {s.stockActual}/{s.stockMinimo} {s.unidad}
                </div>)}
              </div>
            </div>}

            {/* Tabs del módulo */}
            <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
              {["panel","entrada","historial","config"].map(t=>(
                <button key={t} style={{...css.btn(stockTab===t?"primary":"neutral"),fontSize:12}} onClick={()=>setStockTab(t)}>
                  {t==="panel"?"📊 Panel":t==="entrada"?"📥 Agregar stock":t==="historial"?"📋 Historial":"⚙️ Configurar"}
                </button>
              ))}
            </div>

            {/* PANEL — vista del stock actual */}
            {stockTab==="panel"&&categorias.map(cat=>{
              const prods = stock.filter(s=>s.categoria===cat&&s.activo);
              if(prods.length===0) return null;
              return <div key={cat} style={css.card}>
                <div style={css.cardTitle}>{cat}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
                  {prods.map(s=>{
                    const bajo = s.stockActual<=s.stockMinimo&&s.stockMinimo>0;
                    const negativo = s.stockActual<0;
                    const color = negativo?C.danger:bajo?C.warn:C.success;
                    return <div key={s.id} style={{background:"#1a1a1a",border:`2px solid ${color}`,borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:6}}>{s.nombre}</div>
                      <div style={{fontSize:24,fontWeight:900,color}}>{s.stockActual}</div>
                      <div style={{fontSize:11,color:C.muted}}>{s.unidad} · mín. {s.stockMinimo}</div>
                      <div style={{display:"flex",gap:6,marginTop:10}}>
                        <button style={{...css.btn("neutral"),padding:"4px 8px",fontSize:11,flex:1}} onClick={()=>{
                          const cant = parseFloat(window.prompt(`Sacar unidades de ${s.nombre}:`));
                          if(cant>0) registrarMovimiento(s.id,"salida",cant,"ajuste manual");
                        }}>- Sacar</button>
                        <button style={{...css.btn(),padding:"4px 8px",fontSize:11,flex:1}} onClick={()=>{
                          const cant = parseFloat(window.prompt(`Agregar unidades de ${s.nombre}:`));
                          if(cant>0) registrarMovimiento(s.id,"entrada",cant,"ajuste manual");
                        }}>+ Agregar</button>
                      </div>
                    </div>;
                  })}
                </div>
              </div>;
            })}

            {/* ENTRADA — carga de stock */}
            {stockTab==="entrada"&&<div style={css.card}>
              <div style={css.cardTitle}>📥 Agregar Stock</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Usá esto cuando recibís mercadería. Seleccioná el producto, ingresá la cantidad y guardá.</div>
              <div style={css.row}>
                <div style={{flex:2}}>
                  <div style={css.lbl}>Producto</div>
                  <select style={css.sel} value={stockSelId||""} onChange={e=>setStockSelId(e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {categorias.map(cat=><optgroup key={cat} label={cat}>
                      {stock.filter(s=>s.categoria===cat&&s.activo).map(s=><option key={s.id} value={s.id}>{s.nombre} (stock: {s.stockActual} {s.unidad})</option>)}
                    </optgroup>)}
                  </select>
                </div>
                <div style={css.col}>
                  <div style={css.lbl}>Cantidad</div>
                  <input style={css.input} type="number" min="1" placeholder="0" value={stockCantidad} onChange={e=>setStockCantidad(e.target.value)} onFocus={e=>e.target.select()}/>
                </div>
                <div style={{flex:2}}>
                  <div style={css.lbl}>Motivo (opcional)</div>
                  <input style={css.input} placeholder="Ej: Compra a proveedor, donación..." value={stockMotivo} onChange={e=>setStockMotivo(e.target.value)}/>
                </div>
                <div style={{display:"flex",alignItems:"flex-end"}}>
                  <button style={{...css.btn(),opacity:(!stockSelId||!stockCantidad)?0.4:1}} disabled={!stockSelId||!stockCantidad} onClick={async()=>{
                    const cant = parseFloat(stockCantidad);
                    if(!cant||cant<=0) return;
                    await registrarMovimiento(stockSelId,"entrada",cant,stockMotivo||"compra");
                    setStockCantidad(""); setStockMotivo(""); setStockSelId(null);
                    alert("✅ Stock actualizado");
                  }}>📥 Registrar entrada</button>
                </div>
              </div>
            </div>}

            {/* HISTORIAL */}
            {stockTab==="historial"&&<div style={css.card}>
              <div style={css.cardTitle}>📋 Historial de Movimientos</div>
              {stockMovs.length===0
                ?<p style={{color:C.muted,textAlign:"center",padding:"24px"}}>Sin movimientos registrados.</p>
                :<div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr>
                    <th style={css.th}>Fecha</th>
                    <th style={css.th}>Hora</th>
                    <th style={css.th}>Producto</th>
                    <th style={css.th}>Tipo</th>
                    <th style={{...css.th,textAlign:"right"}}>Cantidad</th>
                    <th style={css.th}>Motivo</th>
                  </tr></thead>
                  <tbody>{stockMovs.slice(0,100).map(m=>{
                    const s = stock.find(x=>x.id===m.stockId);
                    return <tr key={m.id}>
                      <td style={css.td}>{fmtFecha(m.fecha)}</td>
                      <td style={css.td}>{m.hora}</td>
                      <td style={{...css.td,fontWeight:600}}>{s?.nombre||"—"}</td>
                      <td style={css.td}>
                        <span style={{...css.tag(m.tipo==="entrada"?C.success:m.tipo==="salida"?C.danger:C.info)}}>
                          {m.tipo==="entrada"?"📥 Entrada":m.tipo==="salida"?"📤 Salida":"🔧 Ajuste"}
                        </span>
                      </td>
                      <td style={{...css.td,textAlign:"right",fontWeight:700,color:m.tipo==="entrada"?C.success:C.danger}}>
                        {m.tipo==="entrada"?"+":"-"}{m.cantidad} {s?.unidad||""}
                      </td>
                      <td style={{...css.td,fontSize:12,color:C.muted}}>{m.motivo||"—"}</td>
                    </tr>;
                  })}</tbody>
                </table></div>}
            </div>}

            {/* CONFIGURAR — nombre, mínimo */}
            {stockTab==="config"&&esAdmin&&<div style={css.card}>
              <div style={css.cardTitle}>⚙️ Configurar Productos de Stock</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Definí el stock mínimo de cada producto. Cuando el stock llegue a ese número, aparece la alerta.</div>
              <div style={{overflowX:"auto"}}><table style={css.table}>
                <thead><tr>
                  <th style={css.th}>Producto</th>
                  <th style={css.th}>Categoría</th>
                  <th style={css.th}>Unidad</th>
                  <th style={{...css.th,textAlign:"right"}}>Stock actual</th>
                  <th style={{...css.th,textAlign:"right"}}>Stock mínimo</th>
                  <th style={css.th}>Ajuste manual</th>
                </tr></thead>
                <tbody>{stock.filter(s=>s.activo).map(s=><tr key={s.id}>
                  <td style={{...css.td,fontWeight:600}}>{s.nombre}</td>
                  <td style={css.td}>{s.categoria}</td>
                  <td style={css.td}>{s.unidad}</td>
                  <td style={{...css.td,textAlign:"right",fontWeight:700,color:s.stockActual<=s.stockMinimo?C.danger:C.success}}>{s.stockActual}</td>
                  <td style={css.td}>
                    <input style={{...css.input,maxWidth:70,textAlign:"right"}} type="number" min="0"
                      defaultValue={s.stockMinimo}
                      onBlur={async e=>{
                        const v = parseFloat(e.target.value);
                        if(!isNaN(v)&&v!==s.stockMinimo) await actualizarMinimo(s.id,v);
                      }}
                    />
                  </td>
                  <td style={css.td}>
                    <div style={{display:"flex",gap:4}}>
                      <button style={{...css.btn("neutral"),padding:"3px 8px",fontSize:11}} onClick={()=>{
                        const v=parseFloat(window.prompt("Stock actual real (ajuste):",s.stockActual));
                        if(!isNaN(v)){const diff=v-s.stockActual;if(diff!==0) registrarMovimiento(s.id,diff>0?"entrada":"salida",Math.abs(diff),"ajuste de inventario");}
                      }}>✏️ Ajustar</button>
                    </div>
                  </td>
                </tr>)}</tbody>
              </table></div>
            </div>}
          </>;
        })()}

        {/* ══ MÓDULO INSUMOS ══ */}
        {tab==="insumos"&&esVentas&&(()=>{
          const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
          const categorias = [...new Set(insumos.map(i=>i.categoria))].sort();
          const insFiltrados = insumos.filter(i=>!insumoBusq||i.nombre.toLowerCase().includes(insumoBusq.toLowerCase())||i.proveedorNombre.toLowerCase().includes(insumoBusq.toLowerCase()));

          const registrarMov = async (insumoId, tipo, cantidad, motivo) => {
            const ins = insumos.find(x=>x.id===insumoId); if(!ins) return;
            const delta = tipo==="salida"?-cantidad:cantidad;
            const nuevoStock = Math.max(0, ins.stockActual + delta);
            const movId = gid();
            const hora = new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
            await supabase.from("insumos").update({stock_actual:nuevoStock,updated_at:new Date().toISOString()}).eq("id",insumoId);
            await supabase.from("insumos_movimientos").insert({id:movId,insumo_id:insumoId,tipo,cantidad,stock_resultante:nuevoStock,motivo,fecha:hoy(),hora,usuario:usuario?.nombre||""});
            setInsumos(prev=>prev.map(x=>x.id===insumoId?{...x,stockActual:nuevoStock}:x));
            setInsumosMovs(prev=>[{id:movId,insumoId,tipo,cantidad,stockResultante:nuevoStock,motivo,fecha:hoy(),hora},...prev]);
          };

          // Calcular sugerido de pedido basado en historial de consumo
          const sugeridoPedido = (insumoId) => {
            const movs = insumosMovs.filter(m=>m.insumoId===insumoId&&m.tipo==="salida");
            if(movs.length<2) return null;
            const fechas = [...new Set(movs.map(m=>m.fecha))].sort();
            if(fechas.length<2) return null;
            const totalConsumo = movs.reduce((s,m)=>s+m.cantidad,0);
            const dias = Math.max(1, (new Date(fechas[fechas.length-1])-new Date(fechas[0]))/(1000*60*60*24));
            const consumoDiario = totalConsumo/dias;
            const consumoSemanal = consumoDiario*7;
            return Math.ceil(consumoSemanal*1.2); // 20% de margen
          };

          return <>
            {/* Tabs del módulo */}
            <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
              {[["panel","📊 Panel"],["control","📝 Control de Stock"],["proveedores","🏪 Proveedores"],["historial","📋 Historial"]].map(([k,l])=>(
                <button key={k} style={{...css.btn(insumosTab===k?"primary":"neutral"),fontSize:12}} onClick={()=>setInsumosTab(k)}>{l}</button>
              ))}
              {esAdmin&&<button style={{...css.btn("neutral"),fontSize:12}} onClick={()=>setModalInsumo("nuevo")}>+ Nuevo insumo</button>}
            </div>

            {/* ── PANEL ── */}
            {insumosTab==="panel"&&<>
              <div style={css.card}>
                <div style={css.row}>
                  <input style={{...css.input,flex:2}} placeholder="Buscar insumo o proveedor..." value={insumoBusq} onChange={e=>setInsumoBusq(e.target.value)}/>
                  <button style={css.btn("neutral")} onClick={()=>setInsumoBusq("")}>✕</button>
                </div>
                <div style={{fontSize:12,color:C.muted,marginTop:4}}>{insumos.length} insumos · {insumos.filter(i=>i.stockActual<=i.stockMinimo&&i.stockMinimo>0).length} bajo mínimo</div>
              </div>
              {categorias.map(cat=>{
                const items = insFiltrados.filter(i=>i.categoria===cat);
                if(items.length===0) return null;
                return <div key={cat} style={css.card}>
                  <div style={css.cardTitle}>{cat}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10}}>
                    {items.map(ins=>{
                      const bajo = ins.stockActual<=ins.stockMinimo&&ins.stockMinimo>0;
                      const color = ins.stockActual<0?C.danger:bajo?C.warn:C.success;
                      const sug = sugeridoPedido(ins.id);
                      return <div key={ins.id} style={{background:"#1a1a1a",border:`2px solid ${color}`,borderRadius:10,padding:"12px"}}>
                        <div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{ins.nombre}</div>
                        <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{ins.proveedorNombre||"Sin proveedor"}</div>
                        <div style={{fontSize:24,fontWeight:900,color}}>{ins.stockActual}</div>
                        <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{ins.unidad} · mín. {ins.stockMinimo}</div>
                        {sug&&<div style={{fontSize:10,color:"#f59e0b",marginBottom:6}}>📦 Pedido sugerido: {sug} {ins.unidad}/sem</div>}
                        {esAdmin&&<div style={{display:"flex",gap:4,marginTop:6}}>
                          <button style={{...css.btn("neutral"),padding:"3px 8px",fontSize:10,flex:1}} onClick={()=>{const v=parseFloat(window.prompt(`Sacar (${ins.unidad}) de ${ins.nombre}:`));if(v>0)registrarMov(ins.id,"salida",v,"control manual");}}>- Sacar</button>
                          <button style={{...css.btn(),padding:"3px 8px",fontSize:10,flex:1}} onClick={()=>{const v=parseFloat(window.prompt(`Agregar (${ins.unidad}) de ${ins.nombre}:`));if(v>0)registrarMov(ins.id,"entrada",v,"entrada manual");}}>+ Agregar</button>
                        </div>}
                      </div>;
                    })}
                  </div>
                </div>;
              })}
            </>}

            {/* ── CONTROL DE STOCK ── */}
            {insumosTab==="control"&&<div style={css.card}>
              <div style={css.cardTitle}>📝 Control de Stock — {hoy()}</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Ingresá el stock físico actual de cada insumo. El sistema calcula el consumo automáticamente.</div>
              <div style={{overflowX:"auto"}}><table style={css.table}>
                <thead><tr>
                  <th style={css.th}>Insumo</th><th style={css.th}>Proveedor</th>
                  <th style={{...css.th,textAlign:"right"}}>Stock sistema</th>
                  <th style={{...css.th,textAlign:"right"}}>Stock físico real</th>
                  <th style={{...css.th,textAlign:"right"}}>Mínimo</th>
                  <th style={{...css.th,textAlign:"right"}}>Sug. pedido/sem</th>
                  <th style={css.th}></th>
                </tr></thead>
                <tbody>{insumos.map(ins=>{
                  const sug = sugeridoPedido(ins.id);
                  const bajo = ins.stockActual<=ins.stockMinimo&&ins.stockMinimo>0;
                  return <tr key={ins.id} style={{background:bajo?"#7f1d1d11":"transparent"}}>
                    <td style={{...css.td,fontWeight:700}}>{ins.nombre}</td>
                    <td style={{...css.td,fontSize:11,color:C.muted}}>{ins.proveedorNombre||"—"}</td>
                    <td style={{...css.td,textAlign:"right",color:bajo?C.danger:C.success,fontWeight:700}}>{ins.stockActual} {ins.unidad}</td>
                    <td style={{...css.td,textAlign:"right"}}>
                      <input style={{...css.input,maxWidth:80,textAlign:"right"}} type="number" step="0.1" min="0"
                        placeholder={String(ins.stockActual)}
                        onBlur={async e=>{
                          const v=parseFloat(e.target.value);
                          if(!isNaN(v)&&v!==ins.stockActual){
                            const diff=v-ins.stockActual;
                            await registrarMov(ins.id,diff>0?"entrada":"control",Math.abs(diff),"control "+hoy());
                            e.target.value="";
                          }
                        }}
                      />
                    </td>
                    <td style={{...css.td,textAlign:"right",color:bajo?C.danger:C.muted}}>{ins.stockMinimo} {ins.unidad}</td>
                    <td style={{...css.td,textAlign:"right",color:"#f59e0b",fontWeight:700}}>{sug?`${sug} ${ins.unidad}`:"—"}</td>
                    <td style={css.td}>
                      {bajo&&<span style={{...css.badge("pendiente"),fontSize:10}}>⚠️ Bajo</span>}
                    </td>
                  </tr>;
                })}</tbody>
              </table></div>
            </div>}

            {/* ── PROVEEDORES ── */}
            {insumosTab==="proveedores"&&<div style={css.card}>
              <div style={css.cardTitle}>🏪 Agenda de Proveedores</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Configurá qué días visita cada proveedor para recibir la alarma automática.</div>
              <div style={{overflowX:"auto"}}><table style={css.table}>
                <thead><tr>
                  <th style={css.th}>Proveedor</th>
                  {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d,i)=><th key={i} style={{...css.th,textAlign:"center"}}>{d}</th>)}
                  <th style={css.th}>Hora</th>
                  <th style={css.th}>Insumos</th>
                </tr></thead>
                <tbody>{provVisitas.map(p=>{
                  const insDelProv = insumos.filter(i=>i.proveedorNombre===p.proveedorNombre);
                  return <tr key={p.id}>
                    <td style={{...css.td,fontWeight:700}}>{p.proveedorNombre}</td>
                    {[0,1,2,3,4,5,6].map(d=><td key={d} style={{...css.td,textAlign:"center"}}>
                      {esAdmin
                        ?<input type="checkbox" checked={p.diasVisita?.includes(d)||false}
                          onChange={async e=>{
                            const nuevos = e.target.checked
                              ?[...(p.diasVisita||[]),d].sort()
                              :(p.diasVisita||[]).filter(x=>x!==d);
                            await supabase.from("proveedores_visitas").update({dias_visita:nuevos}).eq("id",p.id);
                            setProvVisitas(prev=>prev.map(x=>x.id===p.id?{...x,diasVisita:nuevos}:x));
                          }}/>
                        :(p.diasVisita?.includes(d)?<span style={{color:C.success}}>✅</span>:"")
                      }
                    </td>)}
                    <td style={css.td}>
                      {esAdmin
                        ?<input style={{...css.input,maxWidth:80,fontSize:11}} placeholder="10:00" defaultValue={p.horaVisita}
                          onBlur={async e=>{
                            await supabase.from("proveedores_visitas").update({hora_visita:e.target.value}).eq("id",p.id);
                            setProvVisitas(prev=>prev.map(x=>x.id===p.id?{...x,horaVisita:e.target.value}:x));
                          }}/>
                        :p.horaVisita||"—"
                      }
                    </td>
                    <td style={{...css.td,fontSize:11,color:C.muted}}>{insDelProv.length>0?insDelProv.map(i=>i.nombre).join(", "):"Sin insumos asignados"}</td>
                  </tr>;
                })}</tbody>
              </table></div>
            </div>}

            {/* ── HISTORIAL ── */}
            {insumosTab==="historial"&&<div style={css.card}>
              <div style={css.cardTitle}>📋 Historial de Movimientos</div>
              {insumosMovs.length===0
                ?<p style={{color:C.muted,textAlign:"center",padding:24}}>Sin movimientos registrados.</p>
                :<div style={{overflowX:"auto"}}><table style={css.table}>
                  <thead><tr>
                    <th style={css.th}>Fecha</th><th style={css.th}>Insumo</th>
                    <th style={css.th}>Tipo</th><th style={{...css.th,textAlign:"right"}}>Cant.</th>
                    <th style={{...css.th,textAlign:"right"}}>Stock result.</th><th style={css.th}>Motivo</th>
                  </tr></thead>
                  <tbody>{insumosMovs.slice(0,150).map(m=>{
                    const ins=insumos.find(x=>x.id===m.insumoId);
                    return <tr key={m.id}>
                      <td style={css.td}>{fmtFecha(m.fecha)}</td>
                      <td style={{...css.td,fontWeight:600}}>{ins?.nombre||"—"}</td>
                      <td style={css.td}><span style={{...css.tag(m.tipo==="entrada"?C.success:m.tipo==="salida"?C.danger:C.info)}}>{m.tipo==="entrada"?"📥 Entrada":m.tipo==="salida"?"📤 Salida":"📝 Control"}</span></td>
                      <td style={{...css.td,textAlign:"right",fontWeight:700,color:m.tipo==="entrada"?C.success:C.danger}}>{m.tipo==="entrada"?"+":"-"}{m.cantidad} {ins?.unidad||""}</td>
                      <td style={{...css.td,textAlign:"right"}}>{m.stockResultante} {ins?.unidad||""}</td>
                      <td style={{...css.td,fontSize:11,color:C.muted}}>{m.motivo||"—"}</td>
                    </tr>;
                  })}</tbody>
                </table></div>
              }
            </div>}

            {/* Modal nuevo insumo */}
            {modalInsumo==="nuevo"&&<div style={css.modal} onClick={()=>setModalInsumo(null)}>
              <div style={{...css.modalBox,maxWidth:480}} onClick={e=>e.stopPropagation()}>
                <div style={{fontWeight:800,fontSize:16,color:C.accent,marginBottom:16}}>🧺 Nuevo Insumo</div>
                <div style={css.row}>
                  <div style={{flex:2}}><div style={css.lbl}>Nombre</div><input style={css.input} value={insumoForm.nombre} onChange={e=>setInsumoForm(p=>({...p,nombre:e.target.value}))}/></div>
                  <div style={css.col}>
                    <div style={css.lbl}>Unidad</div>
                    <select style={css.sel} value={insumoForm.unidad} onChange={e=>setInsumoForm(p=>({...p,unidad:e.target.value}))}>
                      {["kg","litro","unidad","caja","bolsa","atado","docena","pack"].map(u=><option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div style={css.row}>
                  <div style={css.col}>
                    <div style={css.lbl}>Categoría</div>
                    <select style={css.sel} value={insumoForm.categoria} onChange={e=>setInsumoForm(p=>({...p,categoria:e.target.value}))}>
                      {["Carnes","Verduras","Lácteos","Panificados","Bebidas","Descartables","Limpieza","Congelados","Secos","Otros"].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{flex:2}}>
                    <div style={css.lbl}>Proveedor</div>
                    <select style={css.sel} value={insumoForm.proveedorNombre} onChange={e=>setInsumoForm(p=>({...p,proveedorNombre:e.target.value}))}>
                      <option value="">— Sin asignar —</option>
                      {provVisitas.map(p=><option key={p.id} value={p.proveedorNombre}>{p.proveedorNombre}</option>)}
                    </select>
                  </div>
                </div>
                <div style={css.row}>
                  <div style={css.col}><div style={css.lbl}>Stock mínimo</div><input style={css.input} type="number" value={insumoForm.stockMinimo} onChange={e=>setInsumoForm(p=>({...p,stockMinimo:parseFloat(e.target.value)||0}))}/></div>
                  <div style={css.col}><div style={css.lbl}>Stock inicial</div><input style={css.input} type="number" placeholder="0" id="ins-stock-inicial"/></div>
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
                  <button style={css.btn("neutral")} onClick={()=>setModalInsumo(null)}>Cancelar</button>
                  <button style={{...css.btn(),opacity:!insumoForm.nombre?0.4:1}} disabled={!insumoForm.nombre} onClick={async()=>{
                    const id=gid();
                    const stockIni=parseFloat(document.getElementById("ins-stock-inicial")?.value)||0;
                    await supabase.from("insumos").insert({id,nombre:insumoForm.nombre,categoria:insumoForm.categoria,unidad:insumoForm.unidad,proveedor_nombre:insumoForm.proveedorNombre,stock_actual:stockIni,stock_minimo:insumoForm.stockMinimo,activo:true});
                    setInsumos(prev=>[...prev,{id,nombre:insumoForm.nombre,categoria:insumoForm.categoria,unidad:insumoForm.unidad,proveedorNombre:insumoForm.proveedorNombre,stockActual:stockIni,stockMinimo:insumoForm.stockMinimo,activo:true}].sort((a,b)=>a.categoria.localeCompare(b.categoria)||a.nombre.localeCompare(b.nombre)));
                    setInsumoForm({nombre:"",categoria:"Carnes",unidad:"kg",proveedorNombre:"",stockMinimo:0});
                    setModalInsumo(null);
                    alert("✅ Insumo creado");
                  }}>💾 Guardar</button>
                </div>
              </div>
            </div>}
          </>;
        })()}

        {tab==="config"&&esAdmin&&<>
          {/* Talonarios */}
          <div style={css.card}>
            <div style={{...css.cardTitle,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>📋 Talonarios de Comandas</span>
              <button style={{...css.btn(),fontSize:12,padding:"6px 14px"}} onClick={()=>setModalTalonario(true)}>+ Registrar talonario</button>
            </div>
            <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Registro de todos los talonarios usados. Al cambiar de talonario, el sistema verifica la correlatividad dentro de cada uno.</div>
            {talonarios.length===0
              ?<p style={{color:C.muted,textAlign:"center",padding:"20px"}}>Sin talonarios registrados. Registrá el primero al cambiar de talonario.</p>
              :<div style={{overflowX:"auto"}}><table style={css.table}>
                <thead><tr>
                  <th style={css.th}>Desde</th><th style={css.th}>Hasta</th>
                  <th style={{...css.th,textAlign:"right"}}>Comandas</th>
                  <th style={css.th}>Fecha inicio</th><th style={css.th}>Fecha cierre</th>
                  <th style={css.th}>Vendedor</th><th style={css.th}>Estado</th><th style={css.th}>Obs.</th>
                </tr></thead>
                <tbody>{talonarios.map(t=>{
                  const total = t.hasta - t.desde + 1;
                  const usadas = facturas.filter(f=>f.comanda&&parseInt(f.comanda)>=t.desde&&parseInt(f.comanda)<=t.hasta).length;
                  const pct = Math.round(usadas/total*100);
                  return <tr key={t.id}>
                    <td style={{...css.td,fontWeight:700,color:C.accent}}>#{t.desde}</td>
                    <td style={{...css.td,fontWeight:700}}>#{t.hasta}</td>
                    <td style={{...css.td,textAlign:"right"}}>{usadas}/{total} ({pct}%)</td>
                    <td style={css.td}>{fmtFecha(t.fechaInicio)}</td>
                    <td style={css.td}>{t.fechaCierre?fmtFecha(t.fechaCierre):"—"}</td>
                    <td style={css.td}>{t.vendedor||"—"}</td>
                    <td style={css.td}>
                      <span style={{...css.badge(t.estado==="activo"?"pagada":t.estado==="agotado"?"pendiente":"neutral")}}>
                        {t.estado==="activo"?"✅ Activo":t.estado==="agotado"?"⚠️ Agotado":"🔒 Cerrado"}
                      </span>
                    </td>
                    <td style={{...css.td,fontSize:11,color:C.muted}}>{t.obs||"—"}</td>
                  </tr>;
                })}</tbody>
              </table></div>
            }
          </div>

          {/* Modal registrar talonario manualmente */}
          {modalTalonario&&<div style={css.modal} onClick={()=>setModalTalonario(false)}>
            <div style={{...css.modalBox,maxWidth:420}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:800,fontSize:16,color:C.accent,marginBottom:16}}>📋 Registrar Nuevo Talonario</div>
              <div style={css.row}>
                <div style={css.col}><div style={css.lbl}>N° desde</div><input style={css.input} type="number" value={talDesde} onChange={e=>setTalDesde(e.target.value)} placeholder="Ej: 3081001"/></div>
                <div style={css.col}><div style={css.lbl}>N° hasta</div><input style={css.input} type="number" value={talHasta} onChange={e=>setTalHasta(e.target.value)} placeholder="Ej: 3081100"/></div>
              </div>
              <div style={css.col}><div style={css.lbl}>Observación (opcional)</div><input style={css.input} value={talObs} onChange={e=>setTalObs(e.target.value)} placeholder="Ej: talonario azul, comprado el 01/09"/></div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
                <button style={css.btn("neutral")} onClick={()=>setModalTalonario(false)}>Cancelar</button>
                <button style={{...css.btn(),opacity:(!talDesde||!talHasta)?0.4:1}} disabled={!talDesde||!talHasta} onClick={async()=>{
                  const id = gid();
                  await supabase.from("talonarios").insert({
                    id, numero_desde:parseInt(talDesde), numero_hasta:parseInt(talHasta),
                    fecha_inicio:hoy(), estado:"activo", obs:talObs||"", autorizado_por:"admin"
                  });
                  setTalonarios(prev=>[{id,desde:parseInt(talDesde),hasta:parseInt(talHasta),fechaInicio:hoy(),estado:"activo",obs:talObs},...prev]);
                  setTalDesde(""); setTalHasta(""); setTalObs("");
                  setModalTalonario(false);
                  alert("✅ Talonario registrado");
                }}>💾 Guardar</button>
              </div>
            </div>
          </div>}

          {/* Datos del local */}
          <div style={css.card}>
            <div style={css.cardTitle}>🏪 Datos del Local</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Estos datos aparecen en los comprobantes de venta.</div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Nombre del local</div><input style={css.input} value={datosLocal.nombre} onChange={e=>setDatosLocal(p=>({...p,nombre:e.target.value}))}/></div>
              <div style={{flex:2}}><div style={css.lbl}>Dirección</div><input style={css.input} placeholder="Ej: Calle 123, San Luis" value={datosLocal.direccion} onChange={e=>setDatosLocal(p=>({...p,direccion:e.target.value}))}/></div>
            </div>
            <div style={css.row}>
              <div style={css.col}><div style={css.lbl}>Teléfono / WhatsApp</div><input style={css.input} placeholder="Ej: 2664-123456" value={datosLocal.telefono} onChange={e=>setDatosLocal(p=>({...p,telefono:e.target.value}))}/></div>
              <div style={css.col}><div style={css.lbl}>Instagram / Redes</div><input style={css.input} placeholder="Ej: @foodieslk" value={datosLocal.instagram} onChange={e=>setDatosLocal(p=>({...p,instagram:e.target.value}))}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}>
                <button style={css.btn()} onClick={()=>{
                  localStorage.setItem("foodies_datos_local",JSON.stringify(datosLocal));
                  alert("✅ Datos del local guardados");
                }}>💾 Guardar</button>
              </div>
            </div>
          </div>

          {[
            {titulo:"👤 Vendedores",lista:vendedores,setLista:setVendedores,tipo:"vendedor",key:"v"},
            {titulo:"🛵 Cadetes",lista:cadetes,setLista:setCadetes,tipo:"cadete",key:"c"},
            {titulo:"💳 Medios de Pago",lista:mediosPago,setLista:setMediosPago,tipo:"medio_pago",key:"m"},
            {titulo:"🏪 Tipos de Venta",lista:tiposVenta,setLista:setTiposVenta,tipo:"tipo_venta",key:"t"},
          ].map(({titulo,lista,setLista,tipo,key})=>{
            const agregarItem = async () => {
              const val = cfgInput[key]?.trim();
              if(!val || lista.includes(val)) return;
              const id = gid();
              const {error} = await supabase.from("configuracion").insert({id, tipo, valor:val, activo:true});
              if(!error) {
                setLista(prev=>[...prev, val]);
                setCfgInput(p=>({...p,[key]:""}));
              } else {
                console.error("Error agregando config:", error);
                alert("Error al guardar. Intentá de nuevo.");
              }
            };
            const eliminarItem = async (item) => {
              const {error} = await supabase.from("configuracion").delete().eq("tipo", tipo).eq("valor", item);
              if(!error) {
                setLista(prev=>prev.filter(x=>x!==item));
              } else {
                console.error("Error eliminando config:", error);
                alert("Error al eliminar. Intentá de nuevo.");
              }
            };
            return (
            <div key={key} style={css.card}><div style={css.cardTitle}>{titulo}</div>
              <div style={{marginBottom:12,flexWrap:"wrap",display:"flex"}}>
                {lista.map(item=>(<div key={item} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#1f1f1f",border:`1px solid ${C.border}`,borderRadius:999,padding:"5px 12px",marginRight:8,marginBottom:8,fontSize:12,fontWeight:600}}>
                  {item}<button style={{background:"none",border:"none",cursor:"pointer",color:C.danger,fontWeight:800,fontSize:14,padding:0,lineHeight:1}} onClick={()=>eliminarItem(item)}>×</button>
                </div>))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input style={{...css.input,maxWidth:240}} placeholder="Nuevo..." value={cfgInput[key]||""} onChange={e=>setCfgInput(p=>({...p,[key]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")agregarItem();}}/>
                <button style={css.btn()} onClick={agregarItem}>+ Agregar</button>
              </div>
            </div>
            );
          })}
        </>}
      </main>
    </div>
  );
}
