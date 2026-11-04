
const userInput = "alert('hello')";


eval(userInput);


const element = document.getElementById("output");
element.innerHTML = userInput;
