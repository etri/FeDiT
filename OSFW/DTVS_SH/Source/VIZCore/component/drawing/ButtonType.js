class ButtonType {
    constructor(Sketch) {
        let scope = this;
        let view = document.getElementsByClassName('VIZWeb3D_Buttons')[0];

        this.ButtonItem = function (button_Id, button_Click) {
            let button = {
                id: button_Id,
                event: button_Click,
            }
            return button;
        }

        function createButtonElement(ButtonType, callback) {
            let button_element = document.createElement('button');
            button_element.id = "VIZWeb3D" + ButtonType.id;
            button_element.className = "ButtonType";
            button_element.textContent = ButtonType.id;
            view.appendChild(button_element);
    
            button_element.addEventListener('click', function (e) {
                callback(e);
            });
        }

        let cbBrush = function(){
            Sketch.BrushType();
        };

        let brushButton = scope.ButtonItem("BrushType", "cbBrush");
        createButtonElement(brushButton, cbBrush);

        let cbLine = function(){
            Sketch.LineType();
        };

        let lineButton = scope.ButtonItem("LineType", "cbLine");
        createButtonElement(lineButton, cbLine);

        let cbSquare = function(){
            Sketch.SquareType();
        };

        let squareButton = scope.ButtonItem("SquareType", "cbSquare");
        createButtonElement(squareButton, cbSquare);

        let cbCircle = function () {
            Sketch.CircleType();
        };

        let circleButton = scope.ButtonItem("CircleType", "cbCircle");
        createButtonElement(circleButton, cbCircle);

        let cbtest = function(){
            Sketch.Test();
        };

        let test = scope.ButtonItem("test", "cbtest");
        createButtonElement(test, cbtest);

        let cbnote = function(){
            // let note = document.getElementById('VIZWeb3Dnote');
            // note.style.display = "block";
            // let area = document.getElementById('VIZWeb3Darea');
            // area.value = "";
            Sketch.NoteType();
        };

        let note = scope.ButtonItem("Note", "cbnote");
        createButtonElement(note, cbnote);
    }
};

export default ButtonType;
