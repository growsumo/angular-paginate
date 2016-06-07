var paginateControllerDeps = ['$scope','$element','$timeout'];
var paginateController = function($scope,$element,$timeout){
    var ctrl = this;
    ctrl.oldScroll = 0;
    $scope.addResults = function(){
        // Get current scroll height
        oldScroll = getScrollHeight();

        // Add results to list
        var op = ctrl.direction == 'up' ? 'unshift' : 'push';
        ctrl.pdata[op]({name : "Tony Hawk", position : "test data1"});
        ctrl.pdata[op]({name : "Squirtle", position : "test data2"});
        ctrl.pdata[op]({name : "Ned Larsen", position : "Museum Curator"});
        ctrl.pdata[op]({name : "Petunia Smith", position : "test data 3"});
        ctrl.pdata[op]({name : "Fernandez Ocho", position : "Lawnmower Technician"});

        // Set the scrolling after digest
        $timeout(setScroll);
    }

    ctrl.$onInit = function(){
        // Set all type/direction flags to false
        $scope.tclick = $scope.bclick = $scope.tscroll = $scope.bscroll = false;
        if(ctrl.type == 'click' && ctrl.direction == 'up') $scope.tclick = true;
        if(ctrl.type == 'click' && ctrl.direction == 'down') $scope.bclick = true;
        if(ctrl.type == 'scroll' && ctrl.direction == 'up') $scope.tscroll = true;
        if(ctrl.type == 'scroll' && ctrl.direction == 'down') $scope.bscroll = true;

        // Bind scroll handlers
        if(ctrl.type == 'scroll') bindScroll();

        // Wait for data-binding to scroll to top/bottom
        $timeout(function(){
            if(ctrl.direction == 'down') scrollToTop();
            if(ctrl.direction == 'up') scrollToBottom();
        });
    }

    ctrl.$onDestroy = function(){
        bindScroll(true); // Unbind scroll
    }

    function getScrollHeight(){
        return $element[0].firstChild.scrollHeight;
    }

    function setScroll(){
        if(ctrl.direction == 'down') return;
        var v = (getScrollHeight() - oldScroll);
        $element[0].firstChild.scrollTop = v;
    }

    function scrollToBottom(){
        $element[0].firstChild.scrollTop = $element[0].firstChild.scrollHeight;
    }

    function scrollToTop(){
        $element[0].firstChild.scrollTop = 0;
    }

    function bindScroll(justUnbind){
        angular.element($element[0].firstChild).unbind('scroll');
        if(justUnbind == undefined) angular.element($element[0].firstChild).bind('scroll', function(e){
            // Direction is up and scroll has reached top
            if($scope.tscroll && !e.target.scrollTop) $timeout($scope.addResults);

            // Direction is down and scroll has reached bottom
            else if($scope.bscroll && e.target.scrollTop + $(e.target).innerHeight() >= e.target.scrollHeight) $timeout($scope.addResults);
        });
    }
};

paginateController.$inject = paginateControllerDeps;

angular.module('myApp',[])
.component('paginate', {
    transclude: true,
    bindings: {
        pageMessage:'=',
        pageFunc : '&',
        pdata : '=',
        type : '@',
        direction : '@',
    },
    templateUrl: 'template.html',
    controller : paginateController
})
.controller('ct',function($scope) {
    $scope.page_message = "Show more results"
    $scope.items = [];

    addPage();

    function addPage(){
        $scope.items.push({name : "Ben Bales", position : "Programmer"});
        $scope.items.push({name : "Peter Pasa", position : "Writer"});
        $scope.items.push({name : "Alpha Beta", position : "Tester"});
        $scope.items.push({name : "Nelly Nellis", position : "Admin"});
        $scope.items.push({name : "Tupak Chudleigh", position : "Athlete"});
    }
});
