<script>
import Flare from "../../flare/Flare.svelte";
export let value = false;
let width = 100;
let height = undefined;
let animating = false;
$:animation = value?"switch_day":"switch_night";

function onanimation(previous,current){
    switch(previous){
        case "switch_night":
            switch(current){
                case null:
                    animation = "night_idle";
                break;
            }
        break;
        case "switch_day":
            switch(current){
                case null:
                    animation = "day_idle";
                break;
            }
        break;
    }
}
</script>

<Flare filename="./assets/switch_daytime.flr" style="cursor:pointer;" onclick={()=>value = !value} {onanimation} {width} {height} {animation}/>