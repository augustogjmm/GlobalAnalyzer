const RATIO_SOURCE = "https://www.rankia.com.ar/blog/cedear/6752496-listado-ratio-conversion-cedear-argentina";
const CCL_SOURCE = "https://dolarapi.com/v1/dolares/contadoconliqui";

const ALIASES = {
  DISN:{underlying:"DIS",cedear:"DISN",name:"The Walt Disney Company",ratio:12},
  DIS:{underlying:"DIS",cedear:"DISN",name:"The Walt Disney Company",ratio:12},
  PBR:{underlying:"PBR",cedear:"PBR",name:"Petróleo Brasileiro S.A. - Petrobras",ratio:1,adr:"PBR"},
  AAPL:{underlying:"AAPL",cedear:"AAPL",name:"Apple Inc.",ratio:20},
  AMZN:{underlying:"AMZN",cedear:"AMZN",name:"Amazon.com, Inc.",ratio:144},
  MSFT:{underlying:"MSFT",cedear:"MSFT",name:"Microsoft Corporation",ratio:30},
  TSLA:{underlying:"TSLA",cedear:"TSLA",name:"Tesla, Inc.",ratio:15},
  MELI:{underlying:"MELI",cedear:"MELI",name:"MercadoLibre, Inc.",ratio:120},
  META:{underlying:"META",cedear:"META",name:"Meta Platforms, Inc.",ratio:24},
  NVDA:{underlying:"NVDA",cedear:"NVDA",name:"NVIDIA Corporation",ratio:24},
  AMD:{underlying:"AMD",cedear:"AMD",name:"Advanced Micro Devices, Inc.",ratio:10},
  GOOGL:{underlying:"GOOGL",cedear:"GOOGL",name:"Alphabet Inc.",ratio:58},
  KO:{underlying:"KO",cedear:"KO",name:"The Coca-Cola Company",ratio:5},
  SPY:{underlying:"SPY",cedear:"SPY",name:"SPDR S&P 500 ETF Trust",ratio:60},
  QQQ:{underlying:"QQQ",cedear:"QQQ",name:"Invesco QQQ Trust",ratio:20},
  V:{underlying:"V",cedear:"V",name:"Visa Inc.",ratio:18},
  XOM:{underlying:"XOM",cedear:"XOM",name:"Exxon Mobil Corporation",ratio:10},
  VALE:{underlying:"VALE",cedear:"VALE",name:"Vale S.A.",ratio:2,adr:"VALE"},
  TSM:{underlying:"TSM",cedear:"TSM",name:"Taiwan Semiconductor Manufacturing Company",ratio:9,adr:"TSM"},
  UBER:{underlying:"UBER",cedear:"UBER",name:"Uber Technologies, Inc.",ratio:2},
  INTC:{underlying:"INTC",cedear:"INTC",name:"Intel Corporation",ratio:5},
  ITUB:{underlying:"ITUB",cedear:"ITUB",name:"Itaú Unibanco Holding S.A.",ratio:1,adr:"ITUB"},
  BBD:{underlying:"BBD",cedear:"BBD",name:"Banco Bradesco S.A.",ratio:1,adr:"BBD"},
  GLOB:{underlying:"GLOB",cedear:"GLOB",name:"Globant S.A.",ratio:18},
  PFE:{underlying:"PFE",cedear:"PFE",name:"Pfizer Inc.",ratio:4},
  PYPL:{underlying:"PYPL",cedear:"PYPL",name:"PayPal Holdings, Inc.",ratio:8},
  QCOM:{underlying:"QCOM",cedear:"QCOM",name:"QUALCOMM Incorporated",ratio:11},
  BABA:{underlying:"BABA",cedear:"BABA",name:"Alibaba Group Holding Limited",ratio:9,adr:"BABA"}
};

let ratioCache = {at:0, html:""};

function cors(res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Cache-Control","s-maxage=45, stale-while-revalidate=180");
}
function cleanSymbol(v){
  return String(v||"").toUpperCase().trim().replace(/[^A-Z0-9.\-]/g,"");
}
function decodeHtml(s){
  return String(s||"")
    .replace(/&nbsp;/g," ")
    .replace(/&amp;/g,"&")
    .replace(/&#39;/g,"'")
    .replace(/&quot;/g,'"')
    .replace(/<[^>]*>/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function ratioNumber(v){
  const m=String(v||"").match(/(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)/);
  if(!m)return null;
  const a=Number(m[1].replace(",",".")), b=Number(m[2].replace(",","."));
  return a>0&&b>0?a/b:null;
}
async function fetchJson(url){
  const r=await fetch(url,{headers:{"user-agent":"Mozilla/5.0 GlobalAnalyzer/1.0","accept":"application/json,text/plain,*/*"}});
  if(!r.ok)throw new Error("HTTP "+r.status+" en fuente de datos");
  return r.json();
}
async function ratioFromWeb(symbol){
  try{
    if(!ratioCache.html || Date.now()-ratioCache.at>6*60*60*1000){
      const r=await fetch(RATIO_SOURCE,{headers:{"user-agent":"Mozilla/5.0 GlobalAnalyzer/1.0","accept":"text/html,*/*"}});
      if(r.ok)ratioCache={at:Date.now(),html:await r.text()};
    }
    const h=ratioCache.html;
    if(!h)return null;
    const esc=symbol.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&");
    const re=new RegExp("<td[^>]*>\\s*"+esc+"\\s*</td>\\s*<td[^>]*>[\\s\\S]*?</td>\\s*<td[^>]*>([\\s\\S]*?)</td>","i");
    const m=h.match(re);
    return m?ratioNumber(decodeHtml(m[1])):null;
  }catch(_){return null}
}
async function getCcl(){
  try{
    const j=await fetchJson(CCL_SOURCE);
    const compra=Number(j.compra),venta=Number(j.venta);
    const ref=isFinite(venta)&&venta>0?venta:(isFinite(compra)&&compra>0?compra:null);
    return {compra:isFinite(compra)?compra:null,venta:isFinite(venta)?venta:null,ref:ref,updated:j.fechaActualizacion||null,source:j.nombre||"CCL"};
  }catch(_){return {compra:null,venta:null,ref:null,updated:null,source:"CCL no disponible"}}
}
async function yahooSearch(symbol){
  try{
    const url="https://query1.finance.yahoo.com/v1/finance/search?q="+encodeURIComponent(symbol)+"&quotesCount=8&newsCount=0&listsCount=0";
    const j=await fetchJson(url);
    const qs=(j&&j.quotes)||[];
    return qs.find(x=>String(x.symbol||"").toUpperCase()===symbol) || qs.find(x=>x.quoteType==="EQUITY"||x.quoteType==="ETF") || null;
  }catch(_){return null}
}
async function yahooChart(symbol,interval,compact){
  const range=compact?"5d":"10y";
  const url="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?interval="+encodeURIComponent(interval)+"&range="+range+"&events=div%2Csplits&includeAdjustedClose=true";
  const j=await fetchJson(url);
  const r=j&&j.chart&&j.chart.result&&j.chart.result[0];
  if(!r)throw new Error((j&&j.chart&&j.chart.error&&j.chart.error.description)||"Ticker sin datos");
  const t=r.timestamp||[],q=r.indicators&&r.indicators.quote&&r.indicators.quote[0]||{};
  const candles=[];
  for(let i=0;i<t.length;i++){
    const o=Number(q.open&&q.open[i]),h=Number(q.high&&q.high[i]),l=Number(q.low&&q.low[i]),c=Number(q.close&&q.close[i]),v=Number(q.volume&&q.volume[i]);
    if([o,h,l,c].every(Number.isFinite))candles.push({time:t[i]*1000,open:o,high:h,low:l,close:c,volume:Number.isFinite(v)?v:0});
  }
  if(!candles.length)throw new Error("Sin velas válidas para "+symbol);
  return {candles,meta:r.meta||{}};
}
export default async function handler(req,res){
  cors(res);
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
  try{
    const input=cleanSymbol(req.query.symbol||"PBR");
    const interval=req.query.interval==="1wk"?"1wk":"1d";
    const compact=req.query.compact==="1";
    if(!input)return res.status(400).json({error:"Ingresá un ticker"});
    const preset=ALIASES[input]||null;
    const underlying=cleanSymbol(preset&&preset.underlying||input);
    const cedear=cleanSymbol(preset&&preset.cedear||input);
    const [chart,search,ccl,webRatio]=await Promise.all([
      yahooChart(underlying,interval,compact),
      yahooSearch(underlying),
      getCcl(),
      preset&&preset.ratio?Promise.resolve(null):ratioFromWeb(cedear)
    ]);
    const ratio=(preset&&preset.ratio)||webRatio||null;
    const name=(preset&&preset.name)||(search&&(search.longname||search.shortname))||chart.meta.longName||chart.meta.shortName||underlying;
    const adr=(preset&&preset.adr)||underlying;
    const currency=chart.meta.currency||"USD";
    const regularMarketPrice=Number(chart.meta.regularMarketPrice);
    const last=chart.candles[chart.candles.length-1];
    const price=Number.isFinite(regularMarketPrice)?regularMarketPrice:last.close;
    const arsTheoretical=ratio&&ccl.ref&&currency==="USD"?price*ccl.ref/ratio:null;
    return res.status(200).json({
      input,company:name,underlying,adr,cedear,ratio,
      ratioText:ratio?((Number.isInteger(ratio)?ratio:ratio.toFixed(4))+":1"):"—",
      currency,exchange:chart.meta.fullExchangeName||chart.meta.exchangeName||(search&&search.exchDisp)||"—",
      price,arsTheoretical,ccl,candles:chart.candles,
      sources:{market:"Yahoo Finance",ccl:"DolarApi",ratio:preset&&preset.ratio?"CEDEAR master":"CEDEAR ratio lookup"}
    });
  }catch(e){
    return res.status(500).json({error:e&&e.message?e.message:"Error de mercado"});
  }
}