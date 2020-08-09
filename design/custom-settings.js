customQuestion.onSettingsReceived = setInputValue;

function setInputValue(settings) {
    $("#colorCodes").text(settings.scaleColors);
    renderScaleColorsList();
}

function renderScaleColorsList(scaleNumber) {
    let colors = [];
    let htmlList = [];
    for (let i = 0; i < scaleNumber; i++) {
        let currentColor = getCurrentColor(i);
        colors.push(currentColor);
        let scaleIndex = i+1;
        let liOption =
            '<li class="scale-color-option"><label class="scale-color-label" for="scale-color-' +
            scaleIndex +
            '"> Scale ' +
            scaleIndex +
            ' </label><input class="color-picker" id="scale-color-' +
            scaleIndex +
            '" value="' +
            currentColor +
            '" type="color"></li>';

        htmlList.push(liOption);
    }
    $("#scale-color-list").html(htmlList.join(''));
    updateColorArray(colors);
    subscribeInputColors();
}

function getCurrentColor(index) {
    const colors =
        $("#colorCodes").val() != "" ? $("#colorCodes").val().split(",") : [];
    if (colors.length > index) {
        return colors[index];
    } else {
        let color = getRandomColor();
        while (colors.indexOf(color) > 0) {
            color = getRandomColor();
        }
        return color;
    }
}

function updateColorArray(colors) {
    $("#colorCodes").val(colors.join(","));
}

function getRandomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    let color ="#" + r.toString(16) + g.toString(16) + b.toString(16);
    while (color.length<7) {
        color += '0';
    }
    return color;
}


function saveChanges() {
    const settings = {
        scaleColors: $("#colorCodes").val(),
        highlighterType: getHighlighterType()
    };
    const hasError = false; // inputElement.value === '';
    customQuestion.saveChanges(settings, hasError);
}

function getHighlighterType() {
    const hTypes = $('input[name ="highlighter-type"]');
    for (let i = 0; i < hTypes.length; i++) {
        if (hTypes[i].checked) return hTypes[i].value;
    }
}

function changeColorInArray(index, newColor){
    let colors = $("#colorCodes").val().split(',');
    colors[index] = newColor;
    $("#colorCodes").val(colors.join(','));
}

$(document).ready(function () {
    renderScaleColorsList();
});

$(".highlighter-type").click(function () {
    saveChanges();
});

$("#scale-number").change(function () {
    renderScaleColorsList($("#scale-number").val());
    saveChanges();
});

function subscribeInputColors(){
    $(".color-picker").change(function(){
        const index = this.id.slice(12);
        changeColorInArray(index-1, this.value);
    });
}
