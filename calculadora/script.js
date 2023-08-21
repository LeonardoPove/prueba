// Obtener referencia al campo de entrada y al historial de cálculos
const inputField = document.calculator.ans;
const historyElement = document.querySelector('#calculation-history');

// Inicializar variables
let calculationHistory = []; 
let resultShown = false;
let lastClearTime = 0;


// Actualiza el historial de cálculos en el elemento HTML
function updateHistory() {
    historyElement.innerHTML = calculationHistory.map(item => {
        const [expression, result] = item.split('=').map(str => str.trim());
        return `<div class="calculation-entry">${expression}<br>= ${result}</div>`;
    }).reverse().join('');
    historyElement.scrollTop = 0;
}


// Limpia el campo de entrada
function clearInput() {
    inputField.value = '';
}

// Limpia todo el historial de cálculos
function clearHistory() {
    calculationHistory = [];
    updateHistory();
}

// Valida el contenido del campo de entrada
function validateInput() {
    const expression = inputField.value;

    if (/[\+\-\*\/]{2,}/.test(expression) ||
        /^[\*\/]/.test(expression) ||
        /^0\d/.test(expression) ||
        /[\+\-\*\/]$/.test(expression)) {
        showInputError("Error");
        return false;
    }

    return true;
}

// Muestra un mensaje de error en el campo de entrada
function showInputError(message) {
    inputField.value = message;
    inputField.classList.add('error');
    setTimeout(() => {
        inputField.value = '';
        inputField.classList.remove('error');
    }, 1000); // Limpia el mensaje después de 1 segundo
}

// Realiza el cálculo y actualiza el historial
function calculate() {
    if (validateInput()) {
        const expression = inputField.value;

        try {
            const result = eval(expression);
            calculationHistory.push(`${expression} = ${result}`);
            updateHistory();
            inputField.value = result;
            resultShown = true;
            hidePossibleResult();
        } catch (error) {
            console.error('Error in calculation:', error);
            inputField.value = 'Error en el cálculo.';
        }
    }
}


// Limpia el campo de entrada o el historial de cálculos
function clearInputOrHistory() {
    const currentTime = new Date().getTime();
    if (currentTime - lastClearTime < 500) {
        if (inputField.value === '' || resultShown) {
            clearHistory();
        } else {
            clearInput();
        }
    } else {
        clearInput();
    }
    lastClearTime = currentTime;
}

// Limpia el campo de entrada y el resultado posible
function clearInputAndResult() {
    inputField.value = '';
    hidePossibleResult();
}

// Agregar detectores de eventos a los botones
const buttons = document.querySelectorAll('input[type="button"]');
buttons.forEach(button => {
    const value = button.value;
    if (value === '=' || value === 'C') {
        button.addEventListener('click', function() {
            if (value === 'C') {
                if (inputField.value === '' || resultShown) {
                    clearHistory();
                } else {
                    clearInputAndResult(); // Cambio aquí
                }
            } else {
                const functionName = window[value.toLowerCase()];
                if (typeof functionName === 'function') {
                    functionName();
                }
                if (isNaN(value)) {
                    resultShown = false;
                }
            }
        });
    } else {
        button.addEventListener('click', function() {
            if (resultShown && isNaN(value)) {
                clearInput();
                resultShown = false;
            }
            inputField.value += value;
            
            // Calcula el posible resultado y muéstralo
            const expression = inputField.value;
            try {
                const possibleResult = eval(expression);
                showPossibleResult(possibleResult);
            } catch (error) {
                // Manejo de error si es necesario
            }
        });
    }
});


function showPossibleResult(possibleResult) {
    const resultElement = document.getElementById('possible-result');
    resultElement.textContent = `= ${possibleResult}`;
    resultElement.style.display = 'block';
}

function hidePossibleResult() {
    const resultElement = document.getElementById('possible-result');
    resultElement.textContent = '';
    resultElement.style.display = 'none';
}


// Obtener referencia al botón de borrado dígito por dígito
const backspaceButton = document.getElementById('backspace-button');

// Agregar el evento de clic al botón de borrado dígito por dígito
backspaceButton.addEventListener('click', function() {
    if (resultShown) {
        clearInputAndResult();
    } else {
        const currentValue = inputField.value;
        inputField.value = currentValue.slice(0, -1); // Elimina el último carácter

        const newExpression = inputField.value;
        if (newExpression === '') {
            hidePossibleResult();
        } else {
            try {
                const possibleResult = eval(newExpression);
                showPossibleResult(possibleResult);
            } catch (error) {
                hidePossibleResult();
            }
        }
    }
});
