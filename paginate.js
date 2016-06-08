Object.prototype.componentExtend = function(scope){
    this.$watch = function(prop,handler){
        if(!_.isString(prop)) throw "Property must be a string path"
        scope.$watch(angular.bind(this,function(){
            return _.get(this, prop);
        }), handler)
    }

    this.$watchMany = function(props,handler){
        if(!_.isArray(props)) throw "Properties must be an array of string paths";
        for(var i = 0; i < props.length; i ++) this.$watch(props[i],handler)
    }
}

var paginateControllerDeps = ['$scope','$element','$timeout'];
var paginateController = function($scope,$element,$timeout){
    this.componentExtend($scope);
    var ctrl = this;

    $scope.addResults = function(){
        // Show loader
        $scope.loading = true;

        // No Errors.. yet
        $scope.error = false;

        // Get current scroll height
        scroll.old = scroll.get();

        // Add results to list
        ctrl.pageFunc().success(function(r){
            // Depending on direction, add items to front or back of items
            if(ctrl.direction == 'up') ctrl.items = r.concat(ctrl.items);
            else ctrl.items = ctrl.items.concat(r);

            // Are there more results
            if(true) $scope.noMore = false;

            // Hide loader
            $scope.loading = false;

            // Set the scrolling after digest
            $timeout(scroll.set);
        }).error(function(r){
            // Error
            $scope.error = true;
        });
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

        // Watches
        ctrl.$watchMany(['orderBy', 'query'], function(){
            // If either of these changes, all data must be pulled again
            ctrl.items = [];
            $scope.addResults();
        })

        // Default One-way bind values
        if(_.isUndefined(ctrl.loadingMessage)) ctrl.loadingMessage = "Loading more items..."
        if(_.isUndefined(ctrl.pageMessage)) ctrl.pageMessage = "Load more items"
        if(_.isUndefined(ctrl.errorMessage)) ctrl.errorMessage = "There was a problem retreiving items."

        // Initialize Scope Flags
        $scope.noMore = false;
        $scope.loading = false;
        $scope.error = false;
    }

    ctrl.$onDestroy = function(){
        scroll.bind(true); // Unbind scroll
    }

    var scroll = {
        old : 0, // Old scroll container height
        toTop : function(){
            scroll.element.scrollTop = 0;
        },
        toBottom : function(){
            scroll.element.scrollTop = scroll.element.scrollHeight;
        },
        get : function(){
            return scroll.element.scrollHeight;
        },
        set : function(){
            if(ctrl.direction == 'down') return;
            var v = (scroll.get() - scroll.old);
            scroll.element.scrollTop = v;
        },
        bind : function(justUnbind){
            angular.element(scroll.element).unbind('scroll');
            if(_.isUndefined(justUnbind)) angular.element(scroll.element).bind('scroll', function(e){
                // If there are no more results, dont do anything!
                if($scope.noMore) return;

                // Direction is up and scroll has reached top
                if($scope.tscroll && !scroll.element.scrollTop) $timeout($scope.addResults);

                // Direction is down and scroll has reached bottom
                else if($scope.bscroll && scroll.element.scrollTop + $(scroll.element).innerHeight() >= scroll.element.scrollHeight) $timeout($scope.addResults);
            });
        }
    };
    Object.defineProperty(scroll, 'element', { get : function(){return $element[0].firstChild;}}) // Element is a dynamic property
};

paginateController.$inject = paginateControllerDeps;

angular.module('paginate.paginate',[])
.component('paginate', {
    transclude: true,
    bindings: {
        type : '@', // Type of pagination: click or scroll
        direction : '@', // Direction of scrolling: up or down
        pageMessage: '@', // Clickable message for loading more data
        errorMessage : '@', // Error message
        loadingMessage : '@',
        pageFunc : '&',

        items : '=', // The list of items
        lastKey : '=', // Unique key of the last item
        orderBy : '=', // Ordering parameter
        query : '=', // Search keywords
    },
    templateUrl: 'paginateTemplate.html',
    controller : paginateController
})
