//import $ from 'jquery';

class Element {
    constructor(view, VIZCore) {
        let scope = this;
        this.Use = {
            LoadingProgress: false,
            Splash: false,
        };

        let _TotalDownloadCnt = 0;
        let _CurrentDownloadSeq = 0;

        function onProgress(progressType, percent, loaded, total) {
            //onSplitVIZWProgress(progressType);
            if (!scope.Use.LoadingProgress)
                return;

            let str = '';
            if (progressType === VIZCore.Enum.PROGRESS_TYPES.File_Downloading)
                str = 'File Downloading : ';
            else if (progressType === VIZCore.Enum.PROGRESS_TYPES.Data_Loading)
                str = 'Data Loading : ';

            else
                str = 'Edge Loading : ';

            let $pCaption = $('.progress-bar p');
            let $pCaptionText = $('.progress-bar pText');
            let $pCaptionFile = $('.progress-bar pTextFile');
            let iProgress = document.getElementById(view.GetViewID() + 'inactiveProgress');
            let aProgress = document.getElementById(view.GetViewID() + 'activeProgress');
            if (progressType === 0) {
                drawProgress(0, iProgress, percent, $pCaption, $pCaptionText, $pCaptionFile, loaded, total);
            }
            else if (progressType === 1)
                drawProgress(1, aProgress, percent, $pCaption, $pCaptionText, $pCaptionFile);

            else
                drawProgress(2, aProgress, percent, $pCaption, $pCaptionText, $pCaptionFile);

            let value = (percent * 100).toFixed(2);

            //scope.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Progress.Percentage, { type: progressType, value: value });
        }

        function drawProgress(type, bar, percentage, $pCaption, $pCaptionText, $pCaptionFile, loaded, total) {
            let barCTX = bar.getContext("2d");
            let quarterTurn = Math.PI / 2;
            let endingAngle = ((2 * percentage) * Math.PI) - quarterTurn;
            //if (percentage === 1) {
            //    endingAngle = Math.PI * 2 + quarterTurn;      
            //}
            let startingAngle = 0 - quarterTurn;
            //if (percentage === 1) {
            //    endingAngle = Math.PI * 2 + quarterTurn;
            //}
            if (scope.useFramebuffer)
                $pCaption.text((_CurrentDownloadSeq / _TotalDownloadCnt * 100).toFixed(2) + '%');

            else
                $pCaption.text((parseInt(percentage * 100, 10)) + '%');

            bar.width = bar.width;
            barCTX.lineCap = 'square';

            barCTX.beginPath();

            if (type === 0) {
                let currentTrun = Math.PI / _TotalDownloadCnt * _CurrentDownloadSeq * 2;
                let quarterTurn = Math.PI / 2;
                let startingAngle = 0 - quarterTurn;
                let endingAngle = ((2 * percentage) * Math.PI / _TotalDownloadCnt) - quarterTurn + currentTrun;

                barCTX.lineWidth = 12;
                barCTX.strokeStyle = '#ffe1e1';

                if (percentage === 0)
                    barCTX.lineWidth = 0;

                else
                    barCTX.arc(100, 100, 94, startingAngle, endingAngle);

                $pCaptionText.text('Receiving model...');
            }
            else if (type === 1) {
                barCTX.lineWidth = 6;
                barCTX.strokeStyle = '#e1e1ff';
                if (percentage === 0)
                    barCTX.lineWidth = 0;

                else
                    barCTX.arc(100, 100, 88, startingAngle, endingAngle);

                $pCaptionText.text('Loading model...');
            }
            else if (type === 2) {
                barCTX.lineWidth = 6;
                barCTX.strokeStyle = '#ffffff60';
                if (percentage === 0)
                    barCTX.lineWidth = 0;

                else
                    barCTX.arc(100, 100, 70, startingAngle, endingAngle);
                $pCaption.text('');
                $pCaptionText.text('');
            }
            else {
                barCTX.lineWidth = 6;
                barCTX.strokeStyle = '#e1ffe1';
                if (percentage === 0)
                    barCTX.lineWidth = 0;

                else
                    barCTX.arc(100, 100, 90, startingAngle, endingAngle);

                $pCaptionText.text('Creating edge...');

            }
            barCTX.stroke();
        }

        //type, datapercent
        function onSplitVIZWProgress(splitProgressType) {
            if (splitProgressType !== 0)
                return;
            if (!scope.SplitProgressEnable)
                return;

            let saProgress = document.getElementById('activeSplitProgress');
            if (scope.DataSplit === 0 || scope.totalSplitDownloadCnt <= 0) {
                //Clear
                drawSplitVIZWProgress(0, saProgress, 0, 0, 0);
                return;
            }

            let spercent = scope.currentSplitDownloadCnt / scope.totalSplitDownloadCnt;
            let stotal = scope.totalSplitDownloadCnt;

            //let saProgress = document.getElementById('activeSplitProgress');
            //if (spercent < 1.0)
            drawSplitVIZWProgress(0, saProgress, spercent, scope.currentSplitDownloadCnt, scope.totalSplitDownloadCnt);

            let svalue = (spercent * 100);
            let value = (svalue).toFixed(2);
            //scope.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Progress.Percentage, { type: type, value: value });
        }

        function drawSplitVIZWProgress(splitProgressType, bar, percentage, currnetCnt, totalCnt) {
            let barCTX = bar.getContext("2d");

            barCTX.lineCap = 'square';
            barCTX.beginPath();
            if (splitProgressType === 0) {
                if (percentage !== 0) {
                    let currentTrun = Math.PI / totalCnt * currnetCnt * 2;
                    let quarterTurn = Math.PI / 2;
                    let startingAngle = 0 - quarterTurn;
                    let endingAngle = ((2 * percentage) * Math.PI / totalCnt) - quarterTurn + currentTrun;

                    barCTX.lineWidth = 5;
                    //barCTX.strokeStyle = '#ccffcc';
                    barCTX.strokeStyle = '#22f022';

                    barCTX.arc(40, 40, 12, startingAngle, endingAngle);
                }

                else
                    barCTX.clearRect(0, 0, barCTX.canvas.width, barCTX.canvas.height);
            }
            barCTX.stroke();
        }

        this.Init = function () {
        };

        this.RenderLoadingProgress = function (progressType, percent, loaded, total) {
            if (scope.Use.LoadingProgress) {
                onProgress(progressType, percent, loaded, total);
            }
        };

        this.ShowLoadingProgress = function (show) {
            if (scope.Use.LoadingProgress) {
                if ($('.ProgressPage').length > 0) {
                    if (show) {
                        $('.ProgressPage').fadeIn(500);
                    }
                    else {
                        $('.ProgressPage').fadeOut(500);
                    }
                }
            }
        };

        this.ShowSplash = function (show) {
            if (scope.Use.Splash) {
                if ($('#div_splash').length > 0) {
                    if (show) {
                        $('.ProgressPage').fadeIn(500);
                    }
                    else {
                        $('.ProgressPage').fadeOut(500);
                    }
                }
            }
        };
    }
}

export default Element;