export default function format(input:string,...params:any):string {
	for (let k in params) {
	  input = input.replace("{" + k + "}", params[k])
	}
	return input;
 }