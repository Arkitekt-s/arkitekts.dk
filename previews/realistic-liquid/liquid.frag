#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uTextureSize;
uniform vec2 uCrop;
uniform sampler2D uVideo;
uniform vec4 uStrokes[10];
uniform vec4 uBends[10];
uniform vec4 uArches[3];
uniform vec2 uPointer;
uniform float uSelectedArch;
uniform float uTime;
uniform float uEnergy;
uniform float uModel;
uniform int uCount;
out vec4 fragColor;

float smoothMin(float a,float b,float k){
 float h=max(k-abs(a-b),0.0)/k;
 return min(a,b)-h*h*k*.25;
}
vec2 bezier(vec2 a,vec2 b,vec2 c,float t){
 float q=1.0-t;return q*q*a+2.0*q*t*b+t*t*c;
}
float portalSdf(vec2 p,vec4 box){
 // Arch is a high rounded portal with a flat base.
 float r=(box.z-box.x)*.5;
 float cx=(box.x+box.z)*.5;
 float h=box.w-box.y;
 float top=box.y+r;
 if(p.y<top){
  return length(p-vec2(cx,top))-r;
 }
 vec2 center=vec2(cx,(top+box.w)*.5);
 vec2 halfSize=vec2(r,(box.w-top)*.5);
 vec2 q=abs(p-center)-halfSize;
 return length(max(q,0.0))+min(max(q.x,q.y),0.0);
}
float allArches(vec2 p){
 float d=1.0e6;
 for(int i=0;i<3;i++)d=min(d,portalSdf(p,uArches[i]));
 return d;
}
float fluidField(vec2 p){
 float total=1.0e5;
 float blend=uModel<.7?17.0:(uModel<1.7?10.0:21.0);
 for(int i=0;i<10;i++){
  if(i>=uCount)break;
  vec4 path=uStrokes[i];
  vec4 bend=uBends[i];
  vec2 a=path.xy,b=path.zw,c=bend.xy;
  float width=bend.z;
  if(width<.35)continue;
  float d=1.0e5;
  // Continuous spline centerline with changing radius and rounded volume.
  for(int j=0;j<12;j++){
   float t=float(j)/11.0;
   vec2 pt=bezier(a,c,b,t);
   float bulb=1.0+.20*sin(11.0*t + bend.w + uTime*1.8);
   float profile=mix(1.26,.42,smoothstep(.18,.96,t));
   if(uModel>1.7)profile*=.92+.26*cos(t*8.0+bend.w);
   float rad=width*profile*max(.65,bulb);
   float sd=length(p-pt)-rad;
   d=smoothMin(d,sd,max(1.0,width*.33));
  }
  // The tip remains attached by a narrowed neck, then forms a bulb.
  float tipR=width*(uModel<.7?.86:(uModel<1.7?.48:.73));
  d=smoothMin(d,length(p-b)-tipR,max(2.0,width*.32));
  total=smoothMin(total,d,blend);
  if(uModel>.7&&uModel<1.7){
    // Smaller cohesive satellite droplets follow each water jet.
    vec2 dir=normalize(b-a+vec2(.0001,0.0001));
    for(int k=0;k<2;k++){
      float kk=float(k)+1.0;
      vec2 drop=b+dir*(19.0*kk)+vec2(sin(bend.w+uTime*.8)*10.0*kk,-kk*7.0);
      total=min(total,length(p-drop)-(width*.18/(kk*.65)));
    }
  }
 }
 return total;
}
vec2 filmUV(vec2 p){
 vec2 uv=vec2(p.x/uSize.x,1.0-p.y/uSize.y);
 return clamp((uv-.5)*uCrop+.5,.001,.999);
}
vec3 film(vec2 p){
 return texture(uVideo,filmUV(p)).rgb;
}
void main(){
 vec2 p=vec2(gl_FragCoord.x/uTextureSize.x*uSize.x,
  (1.0-gl_FragCoord.y/uTextureSize.y)*uSize.y);
 if(uEnergy<.012){fragColor=vec4(0);return;}
 // The spilling video is allowed to flow over neighboring panes; only
 // the arch the pointer entered remains the undisturbed source window.
 float outside=portalSdf(p,uArches[int(uSelectedArch)]);
 float fluid=fluidField(p);
 float shell=(1.0-smoothstep(-1.75,2.25,fluid))*smoothstep(-2.5,3.5,outside);
 float across=distance(p,uPointer);
 float swirl=exp(-pow(across/98.0,2.0))*(1.0-smoothstep(-12.0,3.0,outside));
 if(shell<.003&&swirl<.005){fragColor=vec4(0);return;}
 // Derivative of the fluid's signed-distance field supplies a real surface
 // normal for refraction, fresnel edge lighting and two specular highlights.
 vec2 gradient=normalize(vec2(dFdx(fluid)+.0001,dFdy(fluid)+.0001));
 float local=clamp(-fluid/42.0,0.0,1.0);
 float wobble=sin(uTime*2.7 + p.y*.037 + p.x*.017);
 vec2 refractOffset=gradient*(10.0+local*9.0)*shell;
 vec2 samplePoint=p+refractOffset+vec2(wobble*2.6,sin(uTime*3.2+p.x*.04)*2.2);
 vec3 base=film(samplePoint);
 float edge=1.0-smoothstep(-13.0,-1.0,fluid);
 float fresnel=pow(clamp(abs(dot(gradient,normalize(vec2(-.7,-.65)))),0.0,1.0),7.0);
 float glint=pow(max(dot(normalize(vec3(gradient*.77,1.0)),
                    normalize(vec3(-.55,-.57,1.3))),0.0),34.0);
 float glint2=pow(max(dot(normalize(vec3(-gradient*.82,.76)),
                     normalize(vec3(.76,-.32,1.0))),0.0),31.0);
 vec3 deep=base*(uModel<.7?1.13:(uModel<1.7?1.2:1.15));
 float waterShine=uModel<.7?.65:(uModel<1.7?1.05:.83);
 // Spectral rim is refracted from the film: no random rainbow particles.
 vec3 spectrum=vec3(base.r*.8+base.g*.18,base.g*.78+base.b*.2,base.b*.86+base.r*.14);
 vec3 color=mix(deep,spectrum,edge*.38);
 color+=vec3(1.0,.98,.95)*(edge*.31+glint*.70+glint2*.26)*waterShine;
 color+=spectrum*edge*.24;
 color=clamp(color,0.0,1.0);
 float alpha=shell*(uModel<.7?.94:(uModel<1.7?.75:.89));
 // Within the arch a lens-like swirl draws only real colors from the film.
 float a=atan(p.y-uPointer.y,p.x-uPointer.x);
 float r=length(p-uPointer);
 float spin=uTime*1.75-r*.022;
 vec2 vortex=uPointer+(p-uPointer)*mat2(cos(spin),-sin(spin),sin(spin),cos(spin));
 vec3 inside=film(mix(p,vortex,clamp(.25*(1.0-r/120.0),0.0,.24)));
 float swirlAlpha=swirl*.25;
 color=mix(color,inside*1.14,swirlAlpha);
 alpha=max(alpha,swirlAlpha);
 fragColor=vec4(color,clamp(alpha*uEnergy,0.0,1.0));
}