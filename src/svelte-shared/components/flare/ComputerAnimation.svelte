<script>
import Flare from "../../flare/Flare.svelte";
export let style;
</script>

<Flare {style} filename="./assets/Computer Animation.flr" width=500>
    <slot></slot>
</Flare>
