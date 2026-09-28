let score = 0;
let passed = [false, false, false];


// =====================================================
// FEEDBACK
// =====================================================

function feedback(id, text, good) {
    const element = document.getElementById(id);

    element.className =
        "feedback " + (good ? "good" : "bad");

    element.textContent = text;
}


// =====================================================
// SCORE
// =====================================================

function addScore(challengeNumber) {

    if (!passed[challengeNumber - 1]) {

        passed[challengeNumber - 1] = true;

        score++;

        document.getElementById("score").textContent = score;
    }
}


// =====================================================
// CHALLENGE NAVIGATION
// =====================================================

function go(challengeNumber) {

    document
        .querySelectorAll(".challenge")
        .forEach(element => {
            element.classList.remove("active");
        });

    document
        .getElementById("c" + challengeNumber)
        .classList.add("active");

    document.getElementById("progressText").textContent =
        "Challenge " + challengeNumber + " of 3";

    document.getElementById("bar").style.width =
        (challengeNumber / 3 * 100) + "%";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =====================================================
// GENERAL PYTHON RUNNER
// Used by Challenge 2
// =====================================================

async function runPython(code, inputs = []) {

    if (!window.pyodide) {

        throw new Error(
            "Python is not ready yet. Please wait for Python to load."
        );
    }


    window.pyodide.globals.set(
        "_student_code",
        code
    );

    window.pyodide.globals.set(
        "_student_inputs",
        window.pyodide.toPy(inputs)
    );


    const runner = `
import builtins
import io
import contextlib
import traceback

_values = list(_student_inputs)
_position = 0


def student_input(prompt=""):

    global _position

    if _position >= len(_values):

        raise EOFError(
            "Not enough input values were provided."
        )

    value = str(_values[_position])

    _position += 1

    print(prompt + value)

    return value


_original_input = builtins.input

builtins.input = student_input

_output = io.StringIO()


try:

    with contextlib.redirect_stdout(_output):

        exec(_student_code, {})

    result = _output.getvalue()


except Exception:

    result = (
        _output.getvalue()
        + traceback.format_exc()
    )


finally:

    builtins.input = _original_input


result
`;


    return await window.pyodide.runPythonAsync(runner);
}


// =====================================================
// CHALLENGE 1
// RUN PYTHON
// =====================================================

async function runPython1() {

    const output =
        document.getElementById("out1");


    if (!window.pyodide) {

        feedback(
            "fb1",
            "❌ Python is still loading. Please wait until Python is ready.",
            false
        );

        return;
    }


    const code =
        document.getElementById("code1").value;


    output.textContent =
        "▶ Running Python...\n\n";


    try {

        /*
         * Find input() calls in the student's code.
         *
         * This allows the browser to ask the student
         * for input before sending the program to Pyodide.
         */

        const inputPattern =
            /input\s*\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)/g;


        let match;

        const prompts = [];


        while (
            (match = inputPattern.exec(code)) !== null
        ) {

            prompts.push(
                match[1] !== undefined
                    ? match[1]
                    : (match[2] || "")
            );
        }


        const values = [];


        /*
         * Ask for each input value.
         */

        for (
            let i = 0;
            i < prompts.length;
            i++
        ) {

            const answer = window.prompt(
                prompts[i] || "Enter value:"
            );


            if (answer === null) {

                output.textContent =
                    "Program cancelled by student.";


                feedback(
                    "fb1",
                    "ℹ️ Program was cancelled.",
                    false
                );

                return;
            }


            values.push(answer);
        }


        /*
         * Send the code and input values to Pyodide.
         */

        window.pyodide.globals.set(
            "_student_code",
            code
        );

        window.pyodide.globals.set(
            "_interactive_values",
            window.pyodide.toPy(values)
        );


        const execCode = `
import builtins
import io
import contextlib
import traceback

_values = list(_interactive_values)

_index = 0

_output = io.StringIO()


def _student_input(prompt=""):

    global _index

    if _index >= len(_values):

        raise EOFError(
            "Input value was not provided."
        )

    value = _values[_index]

    _index += 1

    return value


_original_input = builtins.input

builtins.input = _student_input


try:

    with contextlib.redirect_stdout(_output):

        exec(_student_code, {})

    _final_output = _output.getvalue()


except Exception:

    _final_output = (
        _output.getvalue()
        + traceback.format_exc()
    )


finally:

    builtins.input = _original_input


_final_output
`;


        const result =
            await window.pyodide.runPythonAsync(execCode);


        /*
         * Display the inputs followed by
         * the actual Python output.
         */

        let display = "";


        for (
            let i = 0;
            i < prompts.length;
            i++
        ) {

            display +=
                (prompts[i] || "Enter value:")
                + String(values[i])
                + "\n";
        }


        display +=
            result ||
            "(Program finished with no output.)";


        output.textContent = display;


        /*
         * Check whether Python produced an error.
         */

        if (
            result &&
            result.includes("Traceback")
        ) {

            feedback(
                "fb1",
                "❌ Python found an error. Read the error shown in the output.",
                false
            );

        } else {

            feedback(
                "fb1",
                "✅ Program executed successfully! Check your output above.",
                true
            );
        }


    } catch (error) {

        output.textContent =
            String(error);


        feedback(
            "fb1",
            "❌ The program could not be executed. Check the Python error above.",
            false
        );
    }
}


// =====================================================
// CHALLENGE 1
// CHECK SOLUTION
// =====================================================

function check1() {

    const code =
        document
            .getElementById("code1")
            .value
            .trim();


    const nextButton =
        document.getElementById("next1");


    /*
     * Student must:
     *
     * 1. Use input() at least twice
     * 2. Perform addition
     * 3. Use print()
     */


    const hasInput =
        (code.match(/\binput\s*\(/g) || []).length >= 2;


    const hasAddition =
        /(?:num1\s*\+\s*num2|num2\s*\+\s*num1)/
            .test(code);


    const hasGenericAddition =
        /[A-Za-z_]\w*\s*\+\s*[A-Za-z_]\w*/
            .test(code);


    const hasPrint =
        /\bprint\s*\(/.test(code);


    if (
        hasInput &&
        (hasAddition || hasGenericAddition) &&
        hasPrint
    ) {

        addScore(1);


        feedback(
            "fb1",
            "🎉 Correct! Your program takes two numbers, adds them, and displays the result.",
            true
        );


        nextButton.disabled = false;


    } else {

        feedback(
            "fb1",
            "❌ Your program is not complete yet. Make sure you input two numbers, add them, and print the result.",
            false
        );


        nextButton.disabled = true;
    }
}


// =====================================================
// CHALLENGE 2
// RUN PYTHON
// =====================================================

async function runPython2() {

    const output =
        document.getElementById("out2");


    if (!window.pyodide) {

        output.textContent =
            "Python is still loading. Please wait until Python is ready.";


        feedback(
            "fb2",
            "❌ Python is still loading. Please wait a moment.",
            false
        );

        return;
    }


    const code =
        document.getElementById("code2").value;


    output.textContent =
        "▶ Running Python...\n\n";


    try {

        const result =
            await runPython(code);


        if (
            result &&
            result.includes("Traceback")
        ) {

            output.textContent = result;


            feedback(
                "fb2",
                "❌ Python found an error. Read the error shown in the output.",
                false
            );


        } else {

            output.textContent =
                result ||
                "(Your program produced no output.)";


            feedback(
                "fb2",
                "✅ Program executed successfully! Check the output above.",
                true
            );
        }


    } catch (error) {

        output.textContent =
            String(error);


        feedback(
            "fb2",
            "❌ The program could not be executed. Check the error above.",
            false
        );
    }
}


// =====================================================
// CHALLENGE 2
// CHECK SOLUTION
// =====================================================

function check2() {

    const code =
        document
            .getElementById("code2")
            .value
            .trim();


    const nextButton =
        document.getElementById("next2");


    const correctLoop =

        /for\s+i\s+in\s+range\s*\(\s*1\s*,\s*6\s*\)\s*:/
            .test(code)

        &&

        /print\s*\(\s*i\s*\)/
            .test(code);


    if (correctLoop) {

        addScore(2);


        feedback(
            "fb2",
            "🎉 Code rescued! You fixed the syntax error correctly.",
            true
        );


        nextButton.disabled = false;


    } else {

        feedback(
            "fb2",
            "❌ Not yet. Check the for statement and make sure it prints 1 to 5.",
            false
        );


        nextButton.disabled = true;
    }
}


// =====================================================
// CHALLENGE 3
// CHECK PREDICTION
// =====================================================

function check3() {

    const answer =
        document
            .getElementById("prediction")
            .value
            .trim();


    const normalized =
        answer.replace(/\s/g, "");


    const finishButton =
        document.getElementById("finish");


    const output =
        document.getElementById("out3");


    if (
        normalized ===
        "[10,20,30,40,50]"
    ) {

        addScore(3);


        output.textContent =
            "✅ Prediction accepted!";


        feedback(
            "fb3",
            "🎉 Correct prediction! You understood what append() does.",
            true
        );


        finishButton.disabled = false;


    } else {

        output.textContent =
            "❌ Prediction not correct. Try again.";


        feedback(
            "fb3",
            "❌ Not quite. Think about what append() does to a list.",
            false
        );


        finishButton.disabled = true;
    }
}


// =====================================================
// FINISH
// =====================================================

function finish() {

    document
        .querySelectorAll(".challenge")
        .forEach(element => {
            element.classList.remove("active");
        });


    document
        .getElementById("complete")
        .classList.add("active");


    document
        .getElementById("finalScore")
        .textContent = score;


    document
        .getElementById("finalMessage")
        .textContent =

        score === 3

            ? "Excellent! You rescued every Python challenge! 🏆"

            : score === 2

                ? "Great work! You solved most of the challenges."

                : "Good effort! Review the challenges and try again.";


    document
        .getElementById("progressText")
        .textContent =
        "Station Complete";


    document
        .getElementById("bar")
        .style.width = "100%";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =====================================================
// PYODIDE INITIALIZATION
// =====================================================

window.pyodide = null;


window.addEventListener(
    "load",
    async function () {

        const status =
            document.getElementById("status");


        const statusText =
            document.getElementById("statusText");


        try {

            statusText.textContent =
                "Loading Python...";


            window.pyodide =
                await loadPyodide();


            status.classList.add("ready");


            statusText.textContent =
                "Python is ready!";


            status.lastChild.textContent =
                " You can now run your Python programs.";


            document
                .getElementById("run1")
                .disabled = false;


            document
                .getElementById("run2")
                .disabled = false;


        } catch (error) {

            statusText.textContent =
                "Python could not load";


            status.lastChild.textContent =
                " Please check your internet connection and refresh the page.";


            console.error(
                "Pyodide loading error:",
                error
            );
        }
    }
);