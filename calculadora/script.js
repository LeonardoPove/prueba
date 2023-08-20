
// Obtener referencia al campo de entrada y al historial de cálculos
const inputField = document.calculator.ans;
const historyElement = document.querySelector('#calculation-history');

// Inicializar variables
let calculationHistory = [];
let resultShown = false;
let lastClearTime = 0;


function updateHistory() {
    historyElement.innerHTML = calculationHistory.reverse().join('<br>');
    calculationHistory.reverse();
    historyElement.scrollTop = 0;
}


function clearInput() {
    inputField.value = '';
}

function clearHistory() {
    calculationHistory = [];
    updateHistory();
}


function validateInput() {
    const expression = inputField.value;
    
    if (/[\+\-\*\/]{2,}/.test(expression)) {
        showInputError("Error");
        return false;
    }

    if (/^[\*\/]/.test(expression)) {
        showInputError("Error");
        return false;
    }

    if (/^0\d/.test(expression)) {
        showInputError("Error");
        return false;
    }

    if (/[\+\-\*\/]$/.test(expression)) {
        showInputError("Error");
        return false;
    }

    return true;
}


function showInputError(message) {
    inputField.value = message;
    inputField.classList.add('error');
    setTimeout(() => {
        inputField.value = '';
        inputField.classList.remove('error');
    }, 1000); // Limpia el mensaje después de 2 segundos
}


function calculate() {
    if (validateInput()) {
        const expression = inputField.value;
        try {
            const result = eval(expression);
            calculationHistory.unshift(`${expression} = ${result}`);
            updateHistory();
            inputField.value = result;
            resultShown = true;
        } catch (error) {
            showError('Error en el cálculo.');
            console.error('Error in calculation:', error);
        }
    }
}


function clearInputOrHistory() {
    const currentTime = new Date().getTime();
    if (currentTime - lastClearTime < 500) {
        if (inputField.value === '') {
            clearHistory();
        } else {
            clearInput();
        }
    } else {
        clearInput();
    }
    lastClearTime = currentTime;
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
                    clearInputOrHistory();
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
        });
    }
});
