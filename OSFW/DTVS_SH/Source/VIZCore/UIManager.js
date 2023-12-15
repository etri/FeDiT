class UIManager {
    constructor(view, VIZCore) {
        let scope = this;
        
        this.Init = function(){
            let divMessage = document.createElement('div');
            divMessage.id = view.GetViewID() + "VIZCore_Message";
            divMessage.className = "ui_message";
    
            let divText = document.createElement('div');
            divText.id = view.GetViewID() + "VIZCore_MessageText"
            divText.className = "ui_message_text";
            divMessage.appendChild(divText);
    
            let divText_p1 = document.createElement('div');
            divText_p1.id = view.GetViewID() + "VIZCore_MessageText_p1"
            divText_p1.className = "ui_message_text-p1";
            divText.appendChild(divText_p1);
    
            view.Container.appendChild(divMessage);
            // $('.ui_message').hide();
            document.getElementById(view.GetViewID() + "VIZCore_Message").style.display = 'none';
    
            let ui_notice_img = document.createElement('div');
            ui_notice_img.id = view.GetViewID() + "ui_notice_img";
            ui_notice_img.style.display = "none";
            ui_notice_img.innerHTML += "<img id=\"ui_notice_img_warning\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsSAAALEgHS3X78AAAClklEQVR4nO1bC3HDMAxVhiAQOgaFUAiFUAiFUAYtg0IohEIIhIzBIGiXnZt6ipL4IytO5ne3u61xY+nZ1teDgoKCgoICXSDiHhEf+Eb3+/5fLAMiHnAc2ycBEdsJAtoMREwHRDwThffmx8Z5q8rXiPhtKXq1nl2tz7sx9bLSJsCUklPkbAIu25w7Hlsi4Gkp1kyMa6xxT10pEwERj2RlD2MzMS7yuHb9qdt7OIy3A6R1u0VEvJAV3Tl8Z0e+c9GRVhiMZe8VMc/u1rM78Qo2cet0i0TBlihob/OeBOt5TY7OfXSiHMEYsxMhhwUZcyJjRo1ndiBub+DOXAgAh/fkqvzsynkQMLmTsoPr2XUlAGZsSY4EUOvNuj1PAnZj3iQr+AjqQ4APsYvCJ4LzJQACIkpV+MbwgQQ45xRLEOCVxYUQAB5ZpSoYtzebx0cQQOsKy7pFJt53CllDCYChW1w2TwhNWiIJGE2yVMGkrc7V3BgCgC+f6btFYpC8ChexBMDQLermCYzb83JJQgREyRCFWPYlCIDIXRgMifMnSECwHQqCVANDigDQ7ipJ+WBhAoJikZCJxKIwSQIgMBoNmUQsDpcmAFJ3laQzMUKmiNBJu0rSubg5TvaKNRLbNklXKWU15nVBQvB9suWz1dTjLIgu2KoqsgZiXSWNmrwRVjyTE+kqpezKGMX/vF96d0XJn7ovl8INMnOE7WCNziyj/C8SzONvwzR684oE+JXPtG5nkJVJttPA95aK1v2cuRsiCeabj2SZbG/9N7QMmFxmGH0Sy59H10UQJPfoPcLHyBT1lu7rGl1YfSprUGcctn1d/Y3Pqqq+ur/6HWA+uC0vW3LcXsqzMLZg6p8a1oo2+ztGBQUFBQWaAIAfJq9d2o1Ek2kAAAAASUVORK5CYII=\" width=\"64px\" >";
            //ui_notice_img.innerHTML += "<img id=\"ui_notice_img_warning\" alt = \"imgfile\" src = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIZGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDgtMDVUMTk6MjE6NDMrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjM0KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTMxVDA5OjMxOjM0KzA5OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmJkYjFjZTgzLWM1MDUtYjU0MS05YWE5LWM3MGU1MDljMmYzMCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjgwZWJlNGU2LTcxYTYtYjM0MC04YmViLTk1ZGEyNTRjMDNhYiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM4N2FmNzA5LWU0NGYtNmQ0Yy1hNTViLTcxODljMWQ2MzM5ZiIgdGlmZjpPcmllbnRhdGlvbj0iMSIgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSIzMjAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI5NiI+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Mzg3YWY3MDktZTQ0Zi02ZDRjLWE1NWItNzE4OWMxZDYzMzlmIiBzdEV2dDp3aGVuPSIyMDE1LTA4LTA1VDE5OjIxOjQzKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjAxZGE3MzllLTE0NGItMzI0NC04NGNhLTc5MmY4Y2JlY2I1OCIgc3RFdnQ6d2hlbj0iMjAyMC0xMi0wM1QxNjozMDowNiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiZGIxY2U4My1jNTA1LWI1NDEtOWFhOS1jNzBlNTA5YzJmMzAiIHN0RXZ0OndoZW49IjIwMjAtMTItMzFUMDk6MzE6MzQrMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7ge+U5AAAAWUlEQVRIiWP8//8/Ay0BE01NH7VgZFjAgk9Su2cSPun/V0vyGAlZQK4PiM485FhAUs4k1QKSsz0pFpBVphBrAdkFFjEWUFQaErKA4qKWcbS4HrVg1ALaWwAAYM8RJIpsTCIAAAAASUVORK5CYII=\" width=\"64px\" >";
            divMessage.appendChild(ui_notice_img);
        };

        this.ShowMessage = function(text){
            if(view.useJquery){
                if ($('#' + view.GetViewID() + 'VIZCore_Message').length > 0) {
                    let textMeasure = text;
                    let message = textMeasure;
                    $('#' + view.GetViewID() +'VIZCore_MessageText').html(message);
                    $('#' + view.GetViewID() +'VIZCore_Message').fadeIn(500);
                }
            } else {
                let ui_message = document.getElementById(view.GetViewID() + "VIZCore_Message");
                if(ui_message){
                    let ui_message_text = document.getElementsByClassName("ui_message_text")[0];
                    ui_message_text.innerText = text;
                    ui_message.style.display = 'block';
                }
            }
            
        };

   

        this.HideMessage = function(){
            if(view.useJquery){
                if ($('#' + view.GetViewID() + 'VIZCore_Message').length > 0) {
                    $('#' + view.GetViewID() +'VIZCore_MessageText').html("");
                    $('#' + view.GetViewID() +'VIZCore_Message').hide();
                }       
            } else {
                let ui_message = document.getElementById(view.GetViewID() + "VIZCore_Message");
                if(ui_message){
                    let ui_message_text = document.getElementsByClassName("ui_message_text")[0];
                    ui_message_text.innerText = "";
                    ui_message.style.display = 'none';
                }
            }
        };

        this.SetLocation = function(top, left){
            if(view.useJquery){
                if ($('#' + view.GetViewID() + 'VIZCore_Message').length > 0) {
                    $('#' + view.GetViewID() + 'VIZCore_Message').css('transform', 'translate(0%, 0%)');
                    $('#' + view.GetViewID() + 'VIZCore_Message').css('top', top + "px");
                    $('#' + view.GetViewID() + 'VIZCore_Message').css('left', left + "px");
                }    
            } else {
                let ui_message = document.getElementById(view.GetViewID() + "VIZCore_Message");
                if(ui_message){
                    ui_message.style.transform = "translate(0%, 0%)";
                    ui_message.style.top = top + "px";
                    ui_message.style.left = left + "px";
                }
            }
        };
    }
}
export default UIManager;