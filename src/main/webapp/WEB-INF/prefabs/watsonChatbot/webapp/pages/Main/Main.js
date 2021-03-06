Application.$controller("WatsonChatbotController", ["$scope", "$element", "Utils", "$timeout", "$compile", function($scope, $element, Utils, $timeout, $compile) {
    "use strict";
    $scope._dataset = [];
    //sample request body necessary for the initial request
    $scope.requestbody = {
        "input": {
            "text": ""
        },
        "alternate_intents": true
    };
    /*
     * This function will be invoked when any of this prefab's property is changed
     * @key: property name
     * @newVal: new value of the property
     * @oldVal: old value of the property
     */
    function propertyChangeHandler(key, newVal, oldVal) {

    }

    function prepRequestBody(val) {
        $scope.requestbody.input.text = val || $scope.message;
        Utils.triggerFn($scope.onBeforesend);
        //push the message from the input box to dataset as "usermessage"
        if ($scope.requestbody.input.text) {
            $scope._dataset.push({
                "usermessage": $scope.requestbody.input.text
            });

        }
        sendRequestBody($scope.requestbody)
    }

    function sendRequestBody(requestbody) {
        $scope.Variables.invokeWatson.setInput('Object', requestbody);
        $scope.Variables.invokeWatson.invoke();
    }

    /* register the property change handler */
    $scope.propertyManager.add($scope.propertyManager.ACTIONS.CHANGE, propertyChangeHandler);

    $scope.onInitPrefab = function() {
        // this method will be triggered post initialization of the prefab.

        //invoke the variable
        prepRequestBody();
    };

    $scope.sendBtnClick = function($event, $isolateScope) {
        $scope.message = $scope.Widgets.messageForm.formWidgets.message.datavalue;
        $scope.Widgets.messageForm.reset();

        //if there is empty message return back do not engage
        if (!$scope.message) {
            return;
        }

        //set the input message in the request body
        prepRequestBody($scope.message);

        //scroll the chat to the end
        scrollChat();
    };

    function scrollChat() {
        $timeout(function() {
            //scroll the chat as soon as a message appends in the list
            $element.find('.chat-content').animate({
                scrollTop: WM.element('.chat-content')[0].scrollHeight
            }, 1000);
            //focus the element after sending the message
            $element.find('[name=message]').focus();
        });

    }

    $scope.disableChat = function() {
        $scope.isBotBusy = true;
        $scope.Widgets.messageForm.formWidgets.message.placeholder = "Please wait...";
    };

    $scope.enableChat = function() {
        $scope.isBotBusy = false;
        $scope.Widgets.messageForm.formWidgets.message.placeholder = "Enter text";
    };

    $scope.sendWatsonInput = function(val) {
        //set the input message in the request body
        prepRequestBody(val);
    };

    function showButtons(inputProps) {
        var inputType = inputProps.type,
            inputOptions = inputProps.options,
            $template = '<br/>';
        if (inputType === 'buttons') {
            _.forEach(inputOptions, function(option) {
                $template = $template + '<button class="btn btn-default" ng-click="sendWatsonInput(\'' + option + '\')">' + option + '</button>';
            })
            $scope.$element.find('.app-livelist-container > li:last .popover').append($compile($template)($scope));
        }
    }

    $scope.invokeWatsononSuccess = function(variable, data) {
        var output_text = _.get(data, 'output.text'),
            inputProps;

        //set the context we received from the watson in the request body as it is needed for next call
        _.set($scope.requestbody, 'context', _.get(data, 'context'));

        //execute the on watson response event
        if ($scope.onWatsonresponse) {
            var response = Utils.triggerFn($scope.onWatsonresponse);
            if (response === false) {
                return;
            }
        }

        //watson may return multiple replies based on the context
        _.forEach(output_text, function(val) {
            $scope._dataset.push({ //push the message from the watson to dataset as "chatbotmessage"
                "chatbotmessage": val
            });
        });
        $timeout(function() {
            inputProps = _.get(data, ['context', 'input']);
            if (inputProps) {
                showButtons(inputProps);
            }
        })

        //scroll the chat to the end
        scrollChat();
    };

}]);