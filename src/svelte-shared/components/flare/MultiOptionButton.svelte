<script>
import Flare from "../../flare/Flare.svelte";
export let onclick;
export let style;
let animation = "deactivate";
function main(e){
    if(onclick) onclick("main");
    switch(animation){
        case "deactivate":
            animation = "activate";
        break;
        case "activate":
        case "":
            animation = "deactivate";
        break;
    }
}
function camera(e){
    animation = "camera_tapped";
    if(onclick) onclick("camera");
}
function pulse(e){
    animation = "pulse_tapped";
    if(onclick) onclick("pulse");
}
function image(e){
    animation = "image_tapped";
    if(onclick) onclick("image");
}
function onanimation(previous,current){
    switch(previous){
        case "pulse_tapped":
        case "image_tapped":
        case "camera_tapped":
            switch(current){
                case "deactivate": break;
                default:
                    animation = "";
                break;
            }
        break;
    }
}
$:opened = animation !== "deactivate";
</script>

<Flare style="position:relative;z-index:0;background:rgba(0,0,0,0.1);{style?" "+style:""}" filename="./assets/MultiOptionButton.flr" width=300 {animation} {onanimation}>
    <div class="floating">
        <div class="floating-wrapper">
            <div on:click={main} class="main-btn"></div>
            {#if opened}
                <div on:click={camera} class="camera-btn"></div>
                <div on:click={pulse} class="pulse-btn"></div>
                <div on:click={image} class="image-btn"></div>
            {/if}
        </div>
    </div>
</Flare>

<style>
    .floating{
        position: absolute;
        z-index: 1;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
    }
    .floating-wrapper{
        position: relative;
        display: grid;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }
    .main-btn{
        position: absolute;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        bottom: 25px;
        justify-self: center;
        align-self: center;
        margin-left: 10px;
        cursor: pointer;
    }

    .camera-btn{
        position: absolute;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        bottom: 150px;
        justify-self: center;
        align-self: center;
        margin-left: -125px;
        cursor: pointer;
    }

    .pulse-btn{
        position: absolute;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        bottom: 150px;
        justify-self: center;
        align-self: center;
        margin-left: 15px;
        cursor: pointer;
    }

    .image-btn{
        position: absolute;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        bottom: 150px;
        justify-self: center;
        align-self: center;
        margin-left: 155px;
        cursor: pointer;
    }
</style>