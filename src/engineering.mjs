export const metersToFeet=m=>m/0.3048;
export function scenarioSpeed(radius,unit,e,f){
 if(!['m','ft'].includes(unit))throw new Error('Radius units must be m or ft.');
 if([radius,e,f].some(x=>x===null||x===undefined||x===''||!Number.isFinite(Number(x))))throw new Error('Enter all three scenario inputs.');
 radius=Number(radius);e=Number(e);f=Number(f);
 if(radius<=0||e<0||e>0.12||f<0||f>0.4||e+f===0)throw new Error('Use positive radius, banking 0–0.12, friction 0–0.40, and a positive combined factor.');
 return Math.sqrt(15*(unit==='m'?metersToFeet(radius):radius)*(e+f));
}
export function circumradius(a,b,c){
 if(![a,b,c].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))return Infinity;
 const ab=Math.hypot(a[0]-b[0],a[1]-b[1]),bc=Math.hypot(b[0]-c[0],b[1]-c[1]),ca=Math.hypot(c[0]-a[0],c[1]-a[1]);
 const twiceArea=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]));
 if(Math.min(ab,bc,ca)<1e-6||twiceArea<1e-8*ab*ca)return Infinity;
 return ab*bc*ca/(2*twiceArea);
}
export function cleanPoints(points){if(!Array.isArray(points))return [];return points.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)).filter((p,i,all)=>!i||Math.hypot(p[0]-all[i-1][0],p[1]-all[i-1][1])>0.01);}
export function resample(points,step=10){
 points=cleanPoints(points);if(points.length<2||!Number.isFinite(step)||step<=0)return [];
 const out=[points[0]];let rest=step;
 for(let i=1;i<points.length;i++){let a=points[i-1],b=points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);while(d>=rest){a=[a[0]+(b[0]-a[0])*rest/d,a[1]+(b[1]-a[1])*rest/d];out.push(a);d=Math.hypot(b[0]-a[0],b[1]-a[1]);rest=step;}rest-=d;}
 return out;
}
export function headingChange(a,b,c){const x=Math.atan2(b[1]-a[1],b[0]-a[0]),y=Math.atan2(c[1]-b[1],c[0]-b[0]);return Math.atan2(Math.sin(y-x),Math.cos(y-x));}
export function haversine(a,b){const rad=Math.PI/180,lat=(b[1]-a[1])*rad,lon=(b[0]-a[0])*rad;return 6371008.8*2*Math.asin(Math.sqrt(Math.sin(lat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(lon/2)**2));}
export function simulationStep(distance,elapsedSeconds){const remaining=Math.max(0,distance-25*elapsedSeconds);return {remaining,alert:remaining<=150,complete:remaining===0};}
