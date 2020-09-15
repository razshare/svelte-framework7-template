<script>
let props = {...$$props};
delete props['$$slots'];
delete props['$$scope'];
delete props['target'];
function init(e){
    if($$props['target'])
        e.slot = $$props['target'];
}
</script>
<div use:init {...props}><slot/></div>