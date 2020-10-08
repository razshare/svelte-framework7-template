export default function slotify(e,mapping):void{
    for(let key in mapping){
        let elements = new Array();
        for(let child of e.children){
            if(child.slot === key){
                elements.push([child,mapping[key]]);
            }
        }
        elements.forEach((element)=>{
            element[1].appendChild(element[0]);
        });
    }
}