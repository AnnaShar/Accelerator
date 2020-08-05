/* global register */
register(function (question, customQuestionSettings, questionViewSettings) {
    new TextHighlighterQuestion({
        "question": question,
        "scaleColors": customQuestionSettings.scaleColors
    });

});

class TextHighlighterQuestion {
    
    constructor(obj) {
        // ---- options ----
        //required
        this.question = obj.question;
        this.scaleColors = obj.scaleColors;

        //optional
        //this.questionType = typeof obj.questionType === "undefined" ? "selector" : obj.questionType;//selector OR highlighter
        //this.singleSelect = typeof obj.singleSelect === "undefined" ? true : obj.singleSelect; // if selector type - set to allow either single of multi choice

        this.excludeStopwords = typeof obj.excludeStopwords === "undefined" ? true : obj.excludeStopwords; // set to use stopword exclusion
        this.separateSentences = typeof obj.separateSentences === "undefined" ? false : obj.separateSentences; // set to visually separate different sentences in the text
        this.showQuestion = typeof obj.showQuestion === "undefined" ? false : true; // show the underlying question that is collecting the responses

        this.minResponses = typeof obj.minResponses === "undefined" ? null : obj.minResponses; // set a minimum number of required selections
        this.maxResponses = typeof obj.maxResponses === "undefined" ? null : obj.maxResponses; // set a maximum number of selections
        // ---- instance vars ----

        this.colorsBackground = {};
        this.colorsText = {};
        this.colorsDefined = false;
        this.buttonWidthDefined = false;
        // this.inputType = 'Tooltip'; //'Tooltip' OR 'Modal'
        this.isHighlighting = false;
        this.highlightState = "highlighting"; //highlighting / clearing
        this.mobileThreshold = Confirmit.page.surveyInfo.mobileThreshold;
        this.questionRequirements = '';
        this.defaultColors = [];
        this.touchHasBeenSet = [];
        // this.minAnswers = typeof obj.minAnswers === "undefined" ? null : obj.minAnswers;
        // this.maxAnswers = typeof obj.maxAnswers === "undefined" ? null : obj.maxAnswers;
        //this.activeTerm = '';

        // ---- graphics ----
        this.onSwitch = "<img class=\"switch-on\" alt=\"on\" src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' x='0px' y='0px' width='20px' height='20px' viewBox='0 0 576 512'%3E%3Cg%3E%3Cpath fill='%23ffffff' opacity='0' d='M384 384a128 128 0 1 1 128-128 127.93 127.93 0 0 1-128 128z' %3E%3C/path%3E%3Cpath fill='%23FFFFFF' opacity='1' d='M384 64H192C86 64 0 150 0 256s86 192 192 192h192c106 0 192-86 192-192S490 64 384 64zm0 320a128 128 0 1 1 128-128 127.93 127.93 0 0 1-128 128z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E\">";

        this.offSwitch = "<img class=\"switch-off\"  alt=\"off\" src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' x='0px' y='0px' width='20px' height='20px' viewBox='0 0 576 512'%3E%3Cg class='fa-group'%3E%3Cpath fill='%23000000' opacity='0.2' d='M384 64H192C86 64 0 150 0 256s86 192 192 192h192c106 0 192-86 192-192S490 64 384 64zM192 384a128 128 0 1 1 128-128 127.93 127.93 0 0 1-128 128z' class='fa-secondary'%3E%3C/path%3E%3Cpath fill='%23FFFFFF' opacity='.3' d='M192 384a128 128 0 1 1 128-128 127.93 127.93 0 0 1-128 128z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E\">";

        // ---- initialize the tool ---
        this.init();

    }


    init() {
        // get question object

        //set default colors to use if none are supplied
        var scales = this.question.scales;
        var totalColors = 0;
        for (var i = 0; i < scales.length; i++) {
            if (scales[i].code != "excl") {
                totalColors += 1;
            }
        }
        if (typeof this.scaleColors !== "undefined" && this.scaleColors != "") {
            this.scaleColors = this.scaleColors.split(",");
        }
        this.defaultColors = this.createDefaultColors(totalColors);

        //hide next if custom validation set
        if ((this.minResponses !== null && this.minResponses > 0) || (this.maxResponses !== null && this.maxResponses > 0)) {
            this.setContinueButton("off");
            var reqs = this.checkMinMaxResponseErrors();
            this.questionRequirements = '<div class="th-requirements">' + reqs.join("<br>") + '</div>';
        }

        this.setCSS();
        this.render();
        this.setColors();
        this.subscribeToQuestion();

    }


    // dynamical set css
    setCSS() {
        var css = `
            #th-question{
                padding: 20px 30px;
                background-color: #f7f7f7;
                border: 1px solid #e2e2e2;
                border-radius: 6px;
            }
            .th-response-wrapper{
                width: 101%;
                max-width: 640px;
            }
            .th-response-wrapper p {
                margin: 5px 0 0 0;
            }
            .th-term {
                margin: 1px 1px 1px 0;
            }
            .th-highlighter .th-term[data-highlight=on] {
                transition: background-color .2s;
            }
            .th-highlighter .th-term {
                padding: 6px 3px;
                color: #000;
                text-decoration: none;
                display: inline-block;
                margin: 0;
            }
            .th-highlighter{
                background-color: #e2e2e2!important;
            }
            .th-answer-btn{
                padding: 6px 10px;
                border: none;
                cursor: pointer;
                font-size: .9em;
                line-height: 20px;
                transition: background-color .4s;
            }
            img.switch-on,img.switch-off{
                height: 20px;
                float: left;
                margin-right: 3px;
            }
            .th-answer-btn[data-state=on] {
                -webkit-box-shadow: 0px 10px 13px -6px rgb(70, 70, 70);
                -moz-box-shadow: 0px 10px 13px -6px rgb(70, 70, 70);
                box-shadow: 0px 10px 13px -6px rgb(70, 70, 70);
            }
            .th-answer-btn[data-state=off] {
                -webkit-box-shadow: none;
                -moz-box-shadow: none;
                box-shadow: none;
            }
            .th-selector .th-term-answerable{
                color: #000;
                text-decoration: none;
                display: inline-block;
                padding: 6px 3px;
                border-radius: 3px;
                cursor: pointer;
            }
            .th-selector .th-term-answerable[data-state=on] {
                background-color: #c7c7c7;
                color: #000;
                opacity: 0.85;
            }
            .th-term-answerable[data-state=off] {
            }   
            .th-answer-btn[data-state=on] img.switch-on,
            .th-answer-btn[data-state=off] img.switch-off {
                display: inline;
            }
            .th-answer-btn[data-state=on] img.switch-off,
            .th-answer-btn[data-state=off] img.switch-on  {
                display: none;
            }
            .jBox-pointer-top:after, 
            .jBox-pointer-bottom:after, 
            .jBox-pointer-left:after, 
            .jBox-pointer-right:after, 
            .jBox-container{
                background-color: #c7c7c7 !important;
            }
            .th-answer-button-left{
               border-top-left-radius: 3px; 
               border-bottom-left-radius: 3px;
            }
            .th-answer-button-right{
                border-top-right-radius: 3px; 
                border-bottom-right-radius: 3px;
             }
            .th-highlighter ::selection {
                background: transparent;
              }
            .th-highlighter ::-moz-selection {
                background: transparent;
              }
            .th-palette {
                width: 20%;
                float: left;
                padding: 5px;
                border-radius: 6px;
                border: 1px solid #e2e2e2;
            }
            .th-highlighter.th-sentence  {
                width: 79%;
                margin-left: 1%;
                float: left;
            }
            .th-clear {
                background-color: #d9dee1;
                color: #000;
            }
            .th-highlighter-btn {
                width: 100%;
                border: none;
                min-height: 40px;
                text-align: left;
                cursor: pointer;
                opacity: 0.9;
                line-height: 28px;
            }
            .th-highlighter-btn img {
                margin-right: 8px;
                height: 28px;
            }
            .th-highlighter-btn .switch-on,
            .th-highlighter-btn.th-highlighter-btn-selected .switch-off {
                display: none;
            }
            .th-highlighter-btn .switch-off,
            .th-highlighter-btn.th-highlighter-btn-selected .switch-on {
                display: inline;
            }
            .th-highlighter-btn-selected{
                opacity: 1;
                font-weight: bold;
            }      
            .th-palette-msg {
                margin: 0 0 5px 0;
                font-weight: bold;
                font-size: 0.9em;
                display: none;
    
            }
            .th-highlighter[data-highlighter-colors="clear"], .th-highlighter[data-highlighter-colors="clear"].active *:hover {cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='35'%3E%3Crect width='15' height='35' fill='%23ffffff' stroke='none' opacity='0.8' /%3E%3C/svg%3E") 7 17, pointer; }
            .clearfix:after{
                content: "";
                display: table;
                clear: both;
            }
            .th-invisible {
                visibility: hidden;
            }
            .th-requirements{
                margin-top: 10px;
            }
            .th-requirements strong{
                padding: 1px 5px;
                background: #f69d51;
                color: #fff;
                display: inline-block;
            }
            `;

        if (this.showQuestion == false) {
            css += '#' + this.question.id + ' .cf-question__content{display:none;}';
        }


        //media queries
        var mediaQueries = `@media (max-width: ` + this.mobileThreshold + `) {
                .th-palette, .th-highlighter.th-sentence {
                    width: 100%;
                    float: none;
                    margin-bottom: 10px;
                    margin-left: 0;
                    padding: 15px !important;
                }
            }`;

        css += mediaQueries;
        var style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'th-css';
        style.innerHTML = css;
        $('head')[0].appendChild(style);

    }

    // generate color styles based on the defined answer colors
    setColors(colorsBackground, colorsText) {

        var css = '';
        var cssHighlighter = '';
        var cssHighlighterActive = '';

        for (var key in colorsBackground) {
            if (Object.prototype.hasOwnProperty.call(colorsBackground, key)) {
                var bgColor = colorsBackground[key];
                css += '[data-colors="' + key + '"], .th-highlighter .th-term[data-highlight=on][data-highlighter-colors="' + key + '"]{background-color: ' + bgColor + '!important;}';

                var cursor = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='35'%3E%3Crect width='15' height='35' fill='" + bgColor.replace('#', '%23') + "' stroke='none' opacity='0.5' /%3E%3C/svg%3E";
                var cursorActive = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='35'%3E%3Crect width='15' height='35' fill='" + bgColor.replace('#', '%23') + "' stroke='none' opacity='0.8' /%3E%3C/svg%3E";
                cssHighlighter += ".th-highlighter[data-highlighter-colors=\"" + key + "\"]:hover,.th-highlighter[data-highlighter-colors=\"" + key + "\"] *:hover {cursor: url(\"" + cursor + "\") 7 17, pointer; }";
                cssHighlighterActive += ".th-highlighter[data-highlighter-colors=\"" + key + "\"].active, .th-highlighter[data-highlighter-colors=\"" + key + "\"].active *:hover {cursor: url(\"" + cursorActive + "\") 7 17, pointer; }";

            }
        }

        for (var key in colorsText) {
            if (Object.prototype.hasOwnProperty.call(colorsText, key)) {
                var textColor = colorsText[key];
                css += '[data-colors="' + key + '"],.th-highlighter .th-term[data-highlight=on][data-highlighter-colors="' + key + '"]{color: ' + textColor + '!important;}';
            }
        }

        $("#th-css").append(css);
        $("#th-css").append(cssHighlighter);
        $("#th-css").append(cssHighlighterActive);

    }

    // render the question and set Ui events
    render() {
        var self = this;

        $(document).ready(function () {

            var text = self.getTermsHTML();
            $('#' + self.question.id).find('.cf-question__content').before('<div id="th-wrapper" class="clearfix"><div id="th-question" class="th-highlighter">' + text + '</div></div>');

            $('#' + self.question.id).find('.cf-question__instruction').append(self.questionRequirements);


            var qId = $(".th-highlighter .th-term-answerable:eq(0)").attr("data-id");
            var palette = self.getAnswerButtons(qId);

            palette = '<div class="th-palette"><p class="th-palette-msg">Select a highlighter:</p>' + palette + '<button class="th-highlighter-btn th-clear" data-colors="clear">' + self.onSwitch + self.offSwitch + 'Clear / Erase</button></div>';
            $("#th-wrapper").prepend(palette);
            $("#th-question").addClass("th-sentence");

            $('.th-selector .th-term-answerable').each(function () {

                var qId = $(this).attr("data-id");
                var code = qId.split("_").reverse()[0];
                var term = $(this).text();
                var buttons = self.getAnswerButtons(qId);

            });

            self.setUIState();

        });

        // events

        // add touch/swipe support

        $(document).on('touchmove', function (e) {
            var touches = e.changedTouches;
            self.isHighlighting = true;
            $(".th-highlighter").addClass("active");

            for (var i = 0; i < touches.length; i++) {
                var _touched = document.elementsFromPoint(touches[i].pageX, touches[i].pageY)[0];
                // console.log(touches[i].pageX, touches[i].pageY);
                // console.log(_touched);
                if (_touched.classList.contains("th-term") == true) {
                    var $touched = $("#" + _touched.id);
                    var touchedId = _touched.id;
                    if (self.touchHasBeenSet.indexOf(touchedId) == -1) {
                        highlight($touched);
                        // console.log(touchedId);
                    }
                }


            }

        });

        $(document).on('touchcancel', function (e) {
            self.touchHasBeenSet = [];
            self.isHighlighting = false;
            $(".th-highlighter").removeClass("active");
        });
        $(document).on('touchend', function (e) {
            self.touchHasBeenSet = [];
            self.isHighlighting = false;
            $(".th-highlighter").removeClass("active");
        });

        //----------

        $(document).on("click", ".th-term-answerable", function (e) {
            e.preventDefault();
        });

        $(document).on("click", ".th-highlighter-btn", function (e) {
            e.preventDefault();
            $(".th-highlighter-btn").removeClass("th-highlighter-btn-selected");
            if ($(this).attr("data-colors") == "clear") {
                self.highlightState = "clearing";
                $(".th-highlighter").attr("data-highlighter-colors", "clear");
            } else {
                self.highlightState = "highlighting";
                $(".th-highlighter-btn").removeClass("th-highlighter-btn-selected");
                $(".th-highlighter").attr("data-highlighter-colors", $(this).attr("data-colors"));
            }
            $(this).addClass("th-highlighter-btn-selected");
        });


        $(document).on("mousedown", ".th-highlighter, .th-highlighter .th-term", function (e) {
            e.preventDefault();
            self.isHighlighting = true;
            $(".th-highlighter").addClass("active");
            if ($(this).hasClass("th-term")) {
                highlight($(this));
            }
        });


        $(document).on("mouseup", function () {
            self.isHighlighting = false;
            $(".th-highlighter").removeClass("active");
        });


        function highlight($elm) {
            var checkHighlighterIsSet = $("#th-question").attr("data-highlighter-colors");
            if (typeof checkHighlighterIsSet === "undefined") {
                return;
            }
            if (self.isHighlighting === true) {
                if (self.highlightState == "clearing") {

                    $elm.attr("data-highlight", "off");
                    $elm.attr("data-highlighter-colors", "");
                } else {
                    $elm.attr("data-highlight", "on");
                    $elm.attr("data-highlighter-colors", $(".th-highlighter").attr("data-highlighter-colors"));
                }
                var code = $("#th-question").attr("data-highlighter-colors");
                var qId = $elm.attr("data-id");

                self.setAnswer(qId);
                self.setUIState();
            }
        }

        $(document).on("mouseover", ".th-highlighter .th-term", function () {
            highlight($(this));
        });


    }


    setAnswer(qId) {
        var self = this;

        var scaleCode = $(".th-highlighter-btn-selected").attr("data-code");


        if (scaleCode != "clear") {
            self.question.setValue(qId, scaleCode);
        } else {
            self.question.setValue(qId, null);
        }


    }


    subscribeToQuestion() {
        this.question.changeEvent.on(this.onQuestionChange.bind(this));
        this.question.validationCompleteEvent.on(this.onQuestionValidationComplete.bind(this));
    }

    onQuestionChange(model) {
        this.setUIState();
    }


    checkMinMaxResponseErrors() {
        var errors = [];
        var totalResponses = 0;

        var responses = this.question.formValues;
        for (var key in responses) {
            if (Object.prototype.hasOwnProperty.call(responses, key)) {
                if (key.indexOf("excl") === -1) {
                    totalResponses += 1;
                }
            }
        }

        var plural = totalResponses == 1 ? '' : 's';
        if (this.minResponses !== null) {

            if (totalResponses < this.minResponses) {
                errors.push("Please make at least <strong>" + this.minResponses + "</strong> selection" + plural + ".");
            }

        }
        if (this.maxResponses !== null) {

            if (totalResponses > this.maxResponses) {
                errors.push("The maximum number of selections is <strong>" + totalResponses + "</strong>.");
            }

        }

        if (this.minResponses !== null && this.maxResponses !== null) {
            if (totalResponses > this.maxResponses || totalResponses < this.minResponses) {
                errors = ["Please make between <strong>" + this.minResponses + "</strong> and <strong>" + this.maxResponses + "</strong> selections."];
            }
        }

        return errors;

    }

    renderErrors(errors) {

        $('#' + this.question.id).removeClass("cf-question--error");
        $('#' + this.question.id + ' .cf-error-block').remove();

        if (errors.length === 0) {
            return;
        }


        const errorList = $('<div class="cf-question__error cf-error-block cf-error-block--bottom">' +
            '<ul class="cf-error-list"></ul>' +
            '</div>');
        errorList.insertAfter('#' + this.question.id + ' .cf-question__instruction');

        errors.forEach(error => {
            $('<li class="cf-error-list__item">' + error + '</li>').appendTo(errorList);
        });

        $('#' + this.question.id).addClass("cf-question--error");

        return;
    }


    setContinueButton(onOff) {

        if (onOff == "on") {
            $(".cf-navigation-next").show();
        } else {
            $(".cf-navigation-next").hide();
        }

    }


    onQuestionValidationComplete(validationResult) {

        $('#' + this.question.id).removeClass("cf-question--error");
        $('#' + this.question.id + ' .cf-error-block').remove();
        const errors = [];
        validationResult.answerValidationResults.forEach(answerValRes => {
            answerValRes.errors.forEach(error => {
                errors.push(('<li class="cf-error-list__item">' + error.message + '</li>'));
            });
        });

        validationResult.errors.forEach(error => {
            errors.push(('<li class="cf-error-list__item">' + error.message + '</li>'));
        });

        if (errors.length === 0) {
            return;
        }

        this.renderErrors(errors);
        errors.forEach(error => {
            $('#' + this.question.id + ' .cf-error-list').append(error);
        });
        $('#' + this.question.id).addClass("cf-question--error");
    }

    // custom functions

    //render existing data
    setUIState() {

        var self = this;
        $('.th-term-answerable').removeAttr('data-colors');

        self.question.answers.forEach(function (item) {
            var itemId = item.code;
            var value = self.question.values[itemId];
            if (typeof value !== "undefined") {
                $('#term_' + itemId).attr('data-colors', value);
            }

        });

        var errors = self.checkMinMaxResponseErrors();
        if (errors.length > 0) {
            $(".th-requirements").removeClass("th-invisible");
            self.setContinueButton("off");
        } else {
            $(".th-requirements").addClass("th-invisible");
            self.setContinueButton("on");
        }


    }

    isSentenceEnd(text) {
        var terminators = [".", "!", "?"];
        var lastChar = text.trim()[text.length - 1];
        //check its a ternimator and only used once in the in the text/word
        if (terminators.indexOf(lastChar) > -1 && (text.indexOf(lastChar) == text.lastIndexOf(lastChar))) {
            return true;
        } else {
            return false;
        }
    }

    // get text from question
    getTermsHTML() {

        var questions = this.question.answers;
        var self = this;

        var terms = questions.map(function (item) {
            var qId = item.code;
            var text = item.text;
            var stopword = false;

            var sentenceBreak = '';
            if (self.isSentenceEnd(text) && self.separateSentences == true) {
                sentenceBreak = '<br><br>';
            }

            if (qId.indexOf('excl_') > -1 || stopword == true) {
                return '<span class="th-term" data-id="' + qId + '">' + text + '</span>' + sentenceBreak;
            } else {
                return '<span class="th-term th-term-answerable" data-state="off" id="term_' + qId + '" data-id="' + qId + '">' + text + '</span>' + sentenceBreak;
            }
        });

        return '<div class="th-text">' + terms.join("") + '</div>';
    }

    // answers from question
    getAnswerButtons(qId) {
        var answers = this.question.scales;
        var self = this;
        var formValues = this.question.formValues;
        var questionType = "highlighter";

        var buttons = answers.filter(function (item) {
            var code = item.code;
            if (code !== "excl") {
                return true;
            } else {
                return false;
            }
        });


        var tempTextColors = {};
        var tempBgColors = {};

        var buttonsHTML = buttons.map(function (item, index) {

            var code = item.code;
            var text = item.text;
            //var parts = text.split("#");
            var answerText = text;

            var dataState = formValues[qId + '_' + code];
            if (typeof dataState !== "undefined" && dataState == "1") {
                dataState = "on";
            } else {
                dataState = "off";
            }

            var dotColor = '';
            if (self.scaleColors.length > 0) {
                var textColor = self.getContrast(self.scaleColors[index]);
                tempBgColors[code] = self.scaleColors[index];
                tempTextColors[code] = textColor;
            } else {
                var defaultColor = self.defaultColors[index];
                var textColor = self.getContrast(defaultColor);
                tempBgColors[code] = "#" + defaultColor;
                tempTextColors[code] = textColor;
            }

            var isLeft = index == 0 ? ' th-' + questionType + '-btn-left ' : '';
            var isRight = index == (buttons.length - 1) ? ' th-' + questionType + '-btn-right ' : '';
            return '<button id="th-' + questionType + '-btn_' + qId + '_' + code + '" type="button" class="th-' + questionType + '-btn ' + isLeft + isRight + ' th-' + questionType + '-btn-width" data-colors="' + code + '" data-state="' + dataState + '" data-code="' + code + '">' + self.onSwitch + self.offSwitch + answerText + '</button>';

        });

        if (self.colorsDefined == false) {
            self.setColors(tempBgColors, tempTextColors);
            self.colorsBackground = tempBgColors;
            self.colorsDefined = true;
        }

        return '<div class="th-' + questionType + 's">' + buttonsHTML.join("") + '</div>';
    }


    // util functions

    // stopwords list
    isStopword(term) {
        var stopwords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours ", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "return", "arent", "cant", "couldnt", "didnt", "doesnt", "dont", "hadnt", "hasnt", "havent", "hes", "heres", "hows", "im", "isnt", "its", "lets", "mustnt", "shant", "shes", "shouldnt", "thats", "theres", "theyll", "theyre", "theyve", "wasnt", "were", "werent", "whats", "whens", "wheres", "whos", "whys", "wont", "wouldnt", "youd", "youll", "youre", "youve"];
        if (stopwords.indexOf(term) > -1) {
            return true;
        } else {
            return false;
        }
    }

    removePunctuation(term) {
        return term.replace(/\.|!|\?|,|:|;|\(|\)|\[|\]|\{|\}|\|/g, '');
    }

    getContrast(hexcolor) {

        // If a leading # is provided, remove it
        if (hexcolor.slice(0, 1) === '#') {
            hexcolor = hexcolor.slice(1);
        }

        // If a three-character hexcode, make six-character
        if (hexcolor.length === 3) {
            hexcolor = hexcolor.split('').map(function (hex) {
                return hex + hex;
            }).join('');
        }

        // Convert to RGB value
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);

        // Get YIQ ratio
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        // Check contrast
        return (yiq >= 128) ? '#000000' : '#ffffff';

    };

    addColorAlpha(h, a) {
        if (h.indexOf('rgb') > -1) {
            return h.replace(")", "," + a + ")");
        } else {
            let r = 0, g = 0, b = 0;
            if (h.length == 4) {
                r = "0x" + h[1] + h[1];
                g = "0x" + h[2] + h[2];
                b = "0x" + h[3] + h[3];

            } else if (h.length == 7) {
                r = "0x" + h[1] + h[2];
                g = "0x" + h[3] + h[4];
                b = "0x" + h[5] + h[6];
            }
            return "rgba(" + +r + "," + +g + "," + +b + "," + a + ")";
        }

    }

    createDefaultColors(total) {
        var colorSets = ['FF6633', 'FFB399', 'FF33FF', 'FFFF99', '00B3E6',
            'E6B333', '3366E6', '999966', '99FF99', 'B34D4D',
            '80B300', '809900', 'E6B3B3', '6680B3', '66991A',
            'FF99E6', 'CCFF1A', 'FF1A66', 'E6331A', '33FFCC',
            '66994D', 'B366CC', '4D8000', 'B33300', 'CC80CC',
            '66664D', '991AFF', 'E666FF', '4DB3FF', '1AB399',
            'E666B3', '33991A', 'CC9999', 'B3B31A', '00E680',
            '4D8066', '809980', 'E6FF80', '1AFF33', '999933',
            'FF3380', 'CCCC00', '66E64D', '4D80CC', '9900B3',
            'E64D66', '4DB380', 'FF4D4D', '99E6E6', '6666FF'];

        var colors = [];
        for (var n = 0; n < total; n++) {
            var color = "cccccc";
            if (n < colorSets.length - 1) {
                color = colorSets[n];
            }
            colors.push(color);
        }

        return colors;

    }


}