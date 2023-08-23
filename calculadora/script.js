// ** Sección 1: Lógica inicial de la calculadora ** //

// Referencias a elementos del DOM...
// Declaración de variables globales...
// Obtener referencia al campo de entrada y al historial de cálculos
// Inicialización de variables y elementos del DOM
const inputField = document.calculator.ans;
const historyElement = document.querySelector('#calculation-history');
const voiceButton = document.getElementById('voice-button');
const recognition = new webkitSpeechRecognition();

// Variables globales para seguimiento y cálculos

let calculationHistory = [];
let resultShown = false;
let lastClearTime = 0;
let cleanedTranscript = '';
let lastResult = null;
let isRecognitionActive = false;
let autoCalculateTimer = null;

function updateHistory() {
    historyElement.innerHTML = calculationHistory
        .map(item => {
            const [expression, result] = item.split('=').map(str => str.trim());

            // Agregar espacios alrededor de los operadores
            const formattedExpression = expression.replace(/([\+\-\*\/])/g, ' $1 ');
            
            return `<div class="calculation-entry">${formattedExpression}<br>= ${result}</div>`;
        })
        .reverse()
        .join('');
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

    // Realiza validaciones en la expresión ingresada
    if (/[\+\-\*\/]{2,}/.test(expression) ||
        /^[\*\/]/.test(expression) ||
        /^0\d/.test(expression) ||
        /[\+\-\*\/]$/.test(expression)) {
        showInputError("Error en la entrada");
        return false;
    }

    return true;
}

// Muestra un mensaje de error en el campo de entrada
function showInputError(message) {
    inputField.value = message;
    inputField.classList.add('error');
    setTimeout(() => {
        // Limpia el mensaje de error después de 1 segundo
        inputField.value = '';
        inputField.classList.remove('error');
    }, 1000);
}

// Limpia el campo de entrada y el resultado posible
function clearInputAndResult() {
    inputField.value = '';
    hidePossibleResult();
}


// ** Sección 2: Funciones para problemas manuales ** //


// Agrega detectores de eventos a los botones
// Configuración de eventos para los botones de la calculadora
const buttons = document.querySelectorAll('input[type="button"]');
buttons.forEach(button => {
    const value = button.value;
    if (value === '=' || value === 'C') {
        button.addEventListener('click', function () {
            if (value === 'C') {
                if (inputField.value === '' || resultShown) {
                    clearHistory();
                } else {
                    clearInputAndResult();
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
        button.addEventListener('click', function () {
            if (resultShown && isNaN(value)) {
                clearInput();
                resultShown = false;
            }
            // Agregar espacios alrededor de los operadores en la entrada manual
            if (value.match(/[\+\-\*\/]/)) {
                inputField.value += ` ${value} `;
            } else {
                inputField.value += value;
            }

            const expression = inputField.value;
            try {
                const possibleResult = eval(expression);
                showPossibleResult(possibleResult);
            } catch (error) {
                // Manejo de errores si es necesario
            }
        });
    }
});

// Lógica para mostrar el posible resultado en la interfaz
// Muestra el posible resultado en la interfaz
function showPossibleResult(possibleResult) {
    const resultElement = document.getElementById('possible-result');
    resultElement.textContent = `= ${possibleResult}`;
    resultElement.style.display = 'block';

}

// Oculta el posible resultado en la interfaz
function hidePossibleResult() {
    const resultElement = document.getElementById('possible-result');
    resultElement.textContent = '';
    resultElement.style.display = 'none';
}

const backspaceButton = document.getElementById('backspace-button');
backspaceButton.addEventListener('click', function () {
    const currentValue = inputField.value;

    if (resultShown) {
        // Si está en modo de resultado mostrado, limpiar el campo de entrada y ocultar el resultado
        clearInputAndResult();
    } else if (recognition.isStarted && cleanedTranscript) {
        // Si el reconocimiento de voz está en marcha y hay una expresión dictada,
        // eliminar dígito por dígito de la expresión dictada
        cleanedTranscript = cleanedTranscript.slice(0, -1);
        processCalculationExpression(cleanedTranscript);
    } else {
        // Si no es un resultado mostrado ni una expresión dictada, eliminar dígito por dígito normalmente
        inputField.value = currentValue.slice(0, -1);

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



// ** Sección 3: Funciones para dictados de voz ** //


// Función para traducir palabras clave en operadores matemáticos
function convertKeywordsToOperators(transcript) {
    const keywordToOperator = {
        'por': '*',
        'multiplicado': '*',
        'menos': '-',
        'dividido': '/',
        'más': '+',
        'uno': '1',
        'dos': '2',
        'tres': '3',
        'cuatro': '4',
        'cinco': '5',
        'seis': '6',
        'siete': '7',
        'ocho': '8',
        'nueve': '9',
        'cero': '0',
        // Agrega más palabras clave y operadores según sea necesario
    };

    // Agregar espacios alrededor de los operadores en el dictado de voz
    transcript = transcript.replace(/([\+\-\*\/])/g, ' $1');

    const words = transcript.split(" ");
    const convertedWords = words.map(word => keywordToOperator[word.toLowerCase()] || word);
    return convertedWords.join(" ");
}

//Reconocimiento de voz 
recognition.lang = 'es-ES';

// Función para reiniciar el temporizador de cálculo automático
function resetAutoCalculateTimer() {
    if (autoCalculateTimer) {
        clearTimeout(autoCalculateTimer);
    }
    autoCalculateTimer = setTimeout(calculateAndSpeak, 1000);
}

// Función para calcular el resultado y mostrarlo en la interfaz
function calculateAndShowResult(expression) {
    try {
        const result = eval(expression);

        // Agregar la operación al historial antes de limpiar el campo de entrada
        calculationHistory.push(`${expression} = ${result}`);
        updateHistory();

        // Mostrar el resultado en el campo de entrada y en la interfaz
        inputField.value = result;
        showPossibleResult(result);

        // Almacenar el último resultado calculado
        lastResult = result;

        // Reiniciar el temporizador para cálculo automático
        resetAutoCalculateTimer();
    } catch (error) {
        console.error('Error en el cálculo:', error);
        inputField.value = 'Error en el cálculo.';
    }
}

// Función para realizar operaciones con el último resultado calculado
function performOperationWithLastResult(operation) {
    if (lastResult !== null) {
        inputField.value += operation + lastResult;
        calculateAndShowResult(inputField.value);
    }
}

// Manejar el resultado del reconocimiento de voz
// Evento que se dispara al obtener resultados del reconocimiento de voz
recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    cleanedTranscript = transcript.trim(); // Actualizar cleanedTranscript aquí

    // Verificar si la entrada es una pregunta de cálculo
    if (cleanedTranscript.includes("cuánto es") || cleanedTranscript.includes("cuanto es")) {
        const expressionWithoutQuestion = cleanedTranscript.replace("cuánto es", "").replace("cuanto es", "");

        // Verificar si la expresión incluye "con ese resultado"
        if (expressionWithoutQuestion.includes("con ese resultado")) {
            const operation = expressionWithoutQuestion.replace("con ese resultado", "").trim();

            // Verificar si la operación es válida (más, menos, por, dividido)
            if (operation === "más" || operation === "menos" || operation === "por" || operation === "dividido") {
                performOperationWithLastResult(operation);
            }
        } else {
            // No se incluye "con ese resultado", continuar con el procesamiento normal
            processCalculationExpression(expressionWithoutQuestion);
        }
    } else {
        // Verificar si la expresión incluye "con ese resultado"
        if (cleanedTranscript.includes("con ese resultado")) {
            const operation = cleanedTranscript.replace("con ese resultado", "").trim();

            // Verificar si la operación es válida (más, menos, por, dividido)
            if (operation === "más" || operation === "menos" || operation === "por" || operation === "dividido") {
                performOperationWithLastResult(operation);
            }
        } else {
            // No se incluye "con ese resultado", continuar con el procesamiento normal
            processCalculationExpression(cleanedTranscript);
        }
    }

    // Si deseas restablecer el botón de micrófono a su estado original aquí:
    if (!recognition.isStarted) {
        voiceButton.classList.remove('active');
        voiceButton.style.backgroundColor = 'transparent'; // Cambiar al fondo original
        voiceButton.style.color = 'black'; // Cambiar al color de texto original
    }
};

// Lógica para procesar expresiones de cálculo desde el reconocimiento de voz
// Procesar expresión de cálculo desde el reconocimiento de voz
function processCalculationExpression(expression) {
    if (expression.includes("dividido en")) {
        const divisionParts = expression.split("dividido en");
        if (divisionParts.length === 2) {
            const numerator = divisionParts[0].trim();
            const denominator = divisionParts[1].trim();
            const convertedNumerator = convertKeywordsToOperators(numerator);
            const convertedDenominator = convertKeywordsToOperators(denominator);
            const divisionExpression = `${convertedNumerator} / ${convertedDenominator}`;
            inputField.value += divisionExpression;
            showPossibleResult(eval(inputField.value));
            resetAutoCalculateTimer();
        }
    } else {
        const convertedTranscript = convertKeywordsToOperators(expression);
        inputField.value +=` ${convertedTranscript}`;
        showPossibleResult(eval(inputField.value));
        resetAutoCalculateTimer();
    }
}

// Función para iniciar el reconocimiento de voz al hacer clic en el botón de voz
// Iniciar o detener el reconocimiento de voz al hacer clic en el botón de voz
voiceButton.addEventListener('click', function () {
    if (!recognition.isStarted) {
        if (!resultShown) {
            inputField.value = '';
        }
        recognition.start();
        voiceButton.classList.add('active');
        voiceButton.style.backgroundColor = '#e06112';
        voiceButton.style.color = 'white';
    }
});

// Función para calcular el resultado sin proporcionar respuesta en voz
// Calcular el resultado de la expresión en el campo de entrada sin hablar
function calculateWithoutSpeaking() {
    const expression = inputField.value;

    try {
        const result = eval(expression);

        // Agregar la operación manual al historial antes de limpiar el campo de entrada
        calculationHistory.push(`${expression} = ${result}`);
        updateHistory();

        // Mostrar el posible resultado en la interfaz
        showPossibleResult(result);

        // Limpiar el campo de entrada y actualizar la interfaz
        inputField.value = result;
        resultShown = true;
        hidePossibleResult();
    } catch (error) {
        console.error('Error en el cálculo:', error);
        inputField.value = 'Error en el cálculo.';
    }
}

// Función para calcular el resultado y proporcionar respuesta en voz
// Calcular el resultado de la expresión y proporcionar respuesta en voz
function calculateAndSpeak() {
    const expression = inputField.value;

    try {
        const result = eval(expression);

        // Agregar la operación al historial antes de limpiar el campo de entrada
        calculationHistory.push( `${expression} = ${result}`);
        updateHistory();

        // Hablar el resultado en voz
        const message = `  ${result}`; // Modificar para incluir expresión
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(message);
        synth.speak(utterance);

        // Limpiar el campo de entrada y actualizar la interfaz
        inputField.value = result;
        resultShown = true;
        hidePossibleResult();
    } catch (error) {
        console.error('Error en el cálculo:', error);
        inputField.value = 'Error en el cálculo.';
    }
}

// Agregar el evento de clic al botón de igual (=) para realizar el cálculo y mostrar el posible resultado sin dictado
const equalsButton = document.querySelector('.operation-buttonecuals');
equalsButton.addEventListener('click', function () {
    if (recognition.isStarted) {
        calculateWithoutSpeaking();
        const expression = inputField.value;
        const result = eval(expression);
        const calculation = `${expression} = ${result}`;
        calculationHistory.push(calculation);
        updateHistory();
        inputField.value = result;
        resultShown = true;
        hidePossibleResult();
    }
});