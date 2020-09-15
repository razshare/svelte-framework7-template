<script>
import FlareInterface from "./FlareInterface";
export let filename = undefined;
export let onload = undefined;
export let animation = undefined;
export let id = undefined;
export let name = undefined;
export let style = undefined;
export let width = undefined;
export let height = undefined;
export let frameAspectRatio = undefined;
export let autoresolve = "height";
let _autoresolve = autoresolve;
let _width = width;
let _height = height;

function onWidthChange(w){
    _width = w;
    autoresolveAnimationFrameRatio(_width,_height);
}
function onHeightChange(h){
    _height = h;
    autoresolveAnimationFrameRatio(_width,_height);
}

function onAutoresolveChange(a){
    _autoresolve = a;
    autoresolveAnimationFrameRatio(_width,_height);
}


function autoresolveAnimationFrameRatio(width__,height__){
    if(!fi) return;
    frameAspectRatio = getFrameAspectRatio();
    if(_autoresolve === "height" && (width || width === 0)){
        _height = frameAspectRatio === 0?0 : width / frameAspectRatio;
        _width = width;
    }else if(_autoresolve === "width" && (height || height === 0)){
        _width = frameAspectRatio * height;
        _height = height;
    }else{
        if(height !== undefined && height === undefined){
            autoresolve = "height";
        }else if(width === undefined && width !== undefined){
            autoresolve = "width";
        }else{
            autoresolve = "width";
        }
    }
}

$: onWidthChange(width);
$: onHeightChange(height);
$: onAutoresolveChange(autoresolve);

export let onanimation = undefined;

export let onkeydown = undefined;
export let onkeypress = undefined;
export let onkeyup = undefined;
export let onclick = undefined;
export let ondblclick = undefined;
export let onmousedown = undefined;
export let onmousemove = undefined;
export let onmouseout = undefined;
export let onmouseover = undefined;
export let onmouseup = undefined;
export let onwheel = undefined;

export let ondrag = undefined;
export let ondragend = undefined;
export let ondragenter = undefined;
export let ondragleave = undefined;
export let ondragover = undefined;
export let ondragstart = undefined;

let cls; export {cls as class}
let fi;
let loaded = false;
export function getFrameAspectRatio(){
    if(!fi) return 0;
    return fi.getFrameAspectRatio();
}
function init(e){
    new FlareInterface("./build/canvaskit",e,(o)=>{
        fi = o;
        fi.load(filename, error=>{
            loaded = true;
            autoresolveAnimationFrameRatio(autoresolve,width,height);

            fi.onAnimationChange((previous,current)=>{
                autoresolveAnimationFrameRatio(autoresolve,width,height);
                if(onanimation)
                    onanimation(previous,current);
            });
            if(onload) onload(fi,error);
        });
    });
}
$: {
    if(fi && loaded && animation){
        fi.setAnimationByName(animation);
    }
}

</script>
<div 
on:keydown={onkeydown}
on:keydown={onkeypress}
on:keydown={onkeyup}

on:click={onclick}
on:dblclick={ondblclick}
on:mousedown={onmousedown}
on:mousemove={onmousemove}
on:mouseout={onmouseout}
on:mouseover={onmouseover}
on:mouseup={onmouseup}
on:onwheel={onwheel}

on:drag={ondrag}
on:dragend={ondragend}
on:dragenter={ondragenter}
on:dragleave={ondragleave}
on:dragover={ondragover}
on:dragstart={ondragstart}

{id}
{name}
style="position:relative;display:inline-block;{_width?" width:"+_width+"px;":""}{_height?" height:"+_height+"px;":""}{style?" "+style:""}"
class={cls}>
    <canvas style="position:relative;{_width?" width:"+_width+"px;":""}{_height?" height:"+_height+"px;":""}" use:init></canvas>
    <slot></slot>
</div>
