var paginateControllerDeps = ['$scope','$element','$timeout'];
var paginateController = function($scope,$element,$timeout){
    componentExtend = function(obj, scope){
        // Check for scope
        if(_.isUndefined(scope)) throw("Object.prototype.componentExtend: scoep must be passed in as agrument");

        obj.$watch = function(prop,handler){
            if(!_.isString(prop)) throw "Property must be a string path"
            scope.$watch(angular.bind(obj,function(){
                return _.get(obj, prop);
            }), handler)
        }

        obj.$watchMany = function(props,handler){
            if(!_.isArray(props)) throw "Properties must be an array of string paths";
            for(var i = 0; i < props.length; i ++) obj.$watch(props[i],handler)
        }
    }

    componentExtend(this,$scope)
    var ctrl = this;

    $scope.addResults = function(){
        // Show loader
        $scope.loadingPage = true;

        // No Errors.. yet
        $scope.paginateError = false;

        // Get current scroll height
        scroll.old = scroll.height;

        // Add results to list
        ctrl.pageFunc().success(function(r){
            console.log(r);
            $scope.initialized = true;

            if(!_.isObject(r.rdata)) r.rdata = JSON.parse(r.rdata)

            // This has to be done on digest
            $timeout(function(){
                // Depending on direction, add items to front or back of items
                if(ctrl.direction == 'up') ctrl.items = r.rdata.concat(ctrl.items);
                else ctrl.items = ctrl.items.concat(r.rdata);

                // Hide loader
                $scope.loadingPage = false;

                // Set the scrolling after digest
                $timeout(scroll.set);
            });

            // Temporary page end
            // if(Math.floor(Math.random()*10) == 5) $scope.noMore = true;

        }).error(function(r){
            // Error
            $scope.paginateError = true;
        });
    }

    ctrl.$onInit = function(){
        $scope.initialized = false;
        // Error Check required params
        if(_.isUndefined(ctrl.type) && _.includes(['click','scroll'],ctrl.type)) throw("angular-paginate: type attribute required can be 'click' or 'scroll'");
        if(_.isUndefined(ctrl.direction) && _.includes(['up','down'],ctrl.direction)) throw("angular-paginate: direction attribute required can be 'up' or 'down'");
        if(_.isUndefined(ctrl.items) && _.isArray(ctrl.items)) throw("angular-paginate: items attribute required, must be an array");
        if(_.isUndefined(ctrl.items) && _.isArray(ctrl.items)) throw("angular-paginate: items attribute required, must be an array");

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
        // ctrl.$watchMany(['orderBy', 'query'], function(){
        //     // If either of these changes, all data must be pulled again
        //     $scope.noMore = false;
        //     $scope.paginateError = false;
        //     _.remove(ctrl.items,true);
        //     if(!$scope.loadingPage && $scope.initialized) $scope.addResults();
        // });
        ctrl.$watch('pageFunc.length',function(){
            console.log('chan');
        })

        // Default One-way bind values
        if(_.isUndefined(ctrl.loadingMessage)) ctrl.loadingMessage = "Loading more items...";
        if(_.isUndefined(ctrl.pageMessage)) ctrl.pageMessage = "Load more items";
        if(_.isUndefined(ctrl.errorMessage)) ctrl.errorMessage = "There was a problem retreiving items.";
        if(_.isUndefined(ctrl.noMoreMessage)) ctrl.noMoreMessage = "Thats it fam, sorry";

        // Initialize Scope Flags
        $scope.noMore = false;
        $scope.loadingPage = false;
        $scope.paginateError = false;

        scroll.element.style.overflowY = "scroll";
        scroll.element.style.height = "100%";

        if(!ctrl.items.length) $timeout($scope.addResults);
    };

    ctrl.$onDestroy = function(){
        scroll.bind(true); // Unbind scroll
    };

    var scroll = {
        old : 0, // Old scroll container height
        toTop : function(){
            scroll.element.scrollTop = 0;
        },
        toBottom : function(){
            scroll.element.scrollTop = scroll.height;
        },
        set : function(){
            if(ctrl.direction == 'down') return;
            scroll.element.scrollTop = (scroll.height - scroll.old);
        },
        bind : function(justUnbind){
            angular.element(scroll.element).unbind('scroll');
            if(_.isUndefined(justUnbind)) angular.element(scroll.element).bind('scroll', function(e){
                // If there are no more results, dont do anything!
                if($scope.noMore) return;

                // Direction is up and scroll has reached top
                if($scope.tscroll && !scroll.element.scrollTop) $timeout($scope.addResults);

                // Direction is down and scroll has reached bottom
                else if($scope.bscroll && scroll.element.scrollTop + $(scroll.element).innerHeight() >= scroll.height) $timeout($scope.addResults);
            });
        }
    };
    Object.defineProperty(scroll, 'element', { get : function(){return $element[0].firstChild;}}) // Element is a dynamic property
    Object.defineProperty(scroll, 'height', { get : function(){return scroll.element.scrollHeight;}}) // Element is a dynamic property
};

paginateController.$inject = paginateControllerDeps;

angular.module('paginate',[])
.component('paginate', {
    transclude: true,
    bindings: {
        // Optional Strings
        pageMessage: '@', // Clickable message for loading more data
        errorMessage : '@', // Error message
        loadingMessage : '@', // Loader message
        noMoreMessage : '@', // No more results message

        // Required Strings
        type : '@', // Type of pagination: click or scroll
        direction : '@', // Direction of scrolling: up or down

        // Required Functions
        pageFunc : '&',

        // Required Scope Vars
        items : '=', // The list of items

        // Optional Scope Vars
        lastKey : '=', // Unique key of the last item
        orderBy : '=', // Ordering parameter
        query : '=', // Search keywords
    },
    templateUrl: 'paginateTemplate.html',
    controller : paginateController
})
