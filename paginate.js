var paginateControllerDeps = ['$scope','$element','$timeout'];
var paginateController = function($scope,$element,$timeout){
    var ctrl = this;
    $scope.addResults = function(){
        // Get current scroll height
        scroll.old = scroll.get();

        // Add results to list
        ctrl.pageFunc({success : function(r){
            // var op = ctrl.direction == 'up' ? 'prepend' : 'append';
            // ctrl.items[op](r)
            if(ctrl.direction == 'up'){
                ctrl.items = r.concat(ctrl.items);
            }else{
                ctrl.items = ctrl.items.concat(r);
            }

            // Set the scrolling after digest
            $timeout(scroll.set);
        }, error : function(r){
            console.log("error");
        }});

    }

    ctrl.$onInit = function(){
        // Set all type/direction flags to false
        $scope.tclick = $scope.bclick = $scope.tscroll = $scope.bscroll = false;
        if(ctrl.type == 'click' && ctrl.direction == 'up') $scope.tclick = true;
        if(ctrl.type == 'click' && ctrl.direction == 'down') $scope.bclick = true;
        if(ctrl.type == 'scroll' && ctrl.direction == 'up') $scope.tscroll = true;
        if(ctrl.type == 'scroll' && ctrl.direction == 'down') $scope.bscroll = true;

        // Bind scroll handlers
        if(ctrl.type == 'scroll') scroll.bind();

        // Wait for data-binding to scroll to top/bottom
        $timeout(function(){
            if(ctrl.direction == 'down') scroll.toTop();
            if(ctrl.direction == 'up') scroll.toBottom();
        });
    }

    ctrl.$onDestroy = function(){
        scroll.bind(true); // Unbind scroll
    }

    var scroll = {
        old : 0, // Old scroll container height
        toTop : function(){
            $element[0].firstChild.scrollTop = 0;
        },

        toBottom : function(){
            $element[0].firstChild.scrollTop = $element[0].firstChild.scrollHeight;
        },
        get : function(){
            return $element[0].firstChild.scrollHeight;
        },
        set : function(){
            if(ctrl.direction == 'down') return;
            var v = (scroll.get() - scroll.old);
            $element[0].firstChild.scrollTop = v;
        },
        bind : function(justUnbind){
            angular.element($element[0].firstChild).unbind('scroll');
            if(justUnbind == undefined) angular.element($element[0].firstChild).bind('scroll', function(e){
                // Direction is up and scroll has reached top
                if($scope.tscroll && !e.target.scrollTop) $timeout($scope.addResults);

                // Direction is down and scroll has reached bottom
                else if($scope.bscroll && e.target.scrollTop + $(e.target).innerHeight() >= e.target.scrollHeight) $timeout($scope.addResults);
            });
        }
    }
};

paginateController.$inject = paginateControllerDeps;

angular.module('myApp',[])
.component('paginate', {
    transclude: true,
    bindings: {
        pageMessage:'=', // Clickable message for loading more data
        items : '=', // The list of items
        type : '@', // Type of pagination: click or scroll
        direction : '@', // Direction of scrolling: up or down
        pageFunc : '&',

        lastKey : '=',
        orderBy : '=',
        query : '=',
    },
    templateUrl: 'paginateTemplate.html',
    controller : paginateController
})
.controller('ct',function($scope, $http) {
    $scope.paginator = {};
    $scope.paginator.page_message = "Get more items!"
    $scope.paginator.items = [];
    $scope.paginator.pageFunc = newPage;
    $scope.paginator.error = false;

    function newPage(success,error){
        $http.get('/testData.json').success(success).error(error);
    }
});
