import { Writable, writable } from 'svelte/store';

let store = {
	login: "Login",
	username:"Username",
	emailAddress:"Email address",
	password:"Password",
	rememberMe:"Remember me",
	forgotPasswordQ: "Forgot password?",
	unknownValidationError: "Unknown validation error",
	register: "Register",
	confirmPassword: "Confirm password",
	iReadTheTermsOfUse: "I read the terms of use",
	summary: "Summary",
	previous: "Previous",
	next: "Next",
	quantity: "Quantity",
	summary: "Summary",
	subtotal: "Subtotal",
	discount: "Discount",
	shipping: "Shipping",
	total: "Total",
	checkout: "Checkout",
	loading: "Loading",
	toPopATag: "to pop a tag",
};

const language:Writable<any> = writable(store);

export default storageExists;