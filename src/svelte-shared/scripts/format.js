export default function format(input,...params) {
	for (let k in params) {
	  input = input.replace("{" + k + "}", params[k])
	}
	return input;
 }