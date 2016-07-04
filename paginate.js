var paginateControllerDeps = ['$scope','$element','$timeout'];
var paginateController = function($scope,$element,$timeout){

    var prevSearch; // Saves previous search - important in keeping tabs on state
    var init = {
        readyToInit : false,
        initialized : false,
        initializing : false,
    };
    $scope.ready = false; // Component is ready

    // These are seperate because they will likely be implemented in a more global setting
    componentExtend = function(obj, scope){
        // Check for scope
        if(_.isUndefined(scope)) throw("Object.prototype.componentExtend: scope must be passed in as agrument");

        obj.$watch = function(prop,handler){
            if(!_.isString(prop)) throw("Property must be a string path");
            scope.$watch(angular.bind(obj,function(){
                return _.get(obj, prop);
            }), handler)
        }

        obj.$watchMany = function(props,handler){
            if(!_.isArray(props)) throw("Properties must be an array of string paths");
            for(var i = 0; i < props.length; i ++) obj.$watch(props[i],handler)
        }
    }

    componentExtend(this,$scope)
    var ctrl = this;

    // Event Listeners
    $scope.$on("paginate",function(e,d){
        if(d.id !== ctrl.config.id) return;
        // Execute method
        switch(d.method){
            case 'bottom':
                $timeout(scroll.toBottom);
                break;
            case 'top':
                $timeout(scroll.toTop);
                break;
            case 'forcePage':
                $scope.addResults();
                break;
            case 'reset':
                $scope.reset();
                break;
        }
    });

    $scope.addResults = function(){

        // Show loader
        $scope.loadingPage = true;

        // No Errors.. yet
        $scope.paginateError = false;

        // Get current scroll height
        scroll.old = scroll.height;

        // Add results to list
        try{
            return ctrl.pageFunc().success(function(r){
                // Parse JSON if necessary
                if(!_.isObject(r.rdata)) r.rdata = JSON.parse(r.rdata)

                // Check if response data is an array
                if(!_.isArray(r.rdata)) throw(r);

                // Are there still more results?
                // TODO: format adata, dont show on first pull
                if(!r.rdata.length){
                    $scope.noMore = true;
                    $scope.loadingPage = false;
                    return;
                }

                if(r.adata) $scope.noMore = true;

                // Set last key
                ctrl.config.lastKey = _.last(r.rdata).key;

                // This has to be done on digest
                $timeout(function(){
                    // First page has been pulled already and there is data, start showing no more items messaged banner
                    if($scope.on_first_page && ctrl.config.items.length !== 0) $scope.on_first_page = false;

                    $scope.$apply(function(){
                        // Depending on direction, add items to front or back of items
                        if(ctrl.direction == 'up'){
                            ctrl.config.items = r.rdata.concat(ctrl.config.items);
                        }else{
                            ctrl.config.items = ctrl.config.items.concat(r.rdata);
                        }
                        // Hide loader
                        $scope.loadingPage = false;

                        // Set the scrolling after digest
                        $timeout(scroll.set);

                        // ready
                        return $scope.ready = true;
                    });
                });
            }).error(function(r){
                // Error
                $scope.paginateError = true;

                return false;
            });
        } catch(e){
            throw("angular-paginate: pageFunc has non-promise type return.")
        }
    }

    ctrl.$onInit = function(){
        // No key on init
        ctrl.config.lastKey = '';

        // Has first page been pulled?
        $scope.on_first_page = true;

        // Error Check required params
        if(_.isUndefined(ctrl.type) && _.includes(['click','scroll'],ctrl.type)) throw("angular-paginate: type attribute required can be 'click' or 'scroll'");
        if(_.isUndefined(ctrl.direction) && _.includes(['up','down'],ctrl.direction)) throw("angular-paginate: direction attribute required can be 'up' or 'down'");
        if(_.isUndefined(ctrl.config.items) && _.isArray(ctrl.config.items)) throw("angular-paginate: items attribute required, must be an array");
        if(_.isUndefined(ctrl.config.items) && _.isArray(ctrl.config.items)) throw("angular-paginate: items attribute required, must be an array");

        // Set all type/direction flags to false
        $scope.tclick = $scope.bclick = $scope.tscroll = $scope.bscroll = false;
        if(ctrl.type == 'click' && ctrl.direction == 'up') $scope.tclick = true;
        if(ctrl.type == 'click' && ctrl.direction == 'down') $scope.bclick = true;
        if(ctrl.type == 'scroll' && ctrl.direction == 'up') $scope.tscroll = true;
        if(ctrl.type == 'scroll' && ctrl.direction == 'down') $scope.bscroll = true;

        // Bind scroll handlers
        ctrl.type == 'scroll' && scroll.bind();

        // Wait for data-binding to scroll to top/bottom
        $timeout(function(){
            ctrl.direction == 'down' && scroll.toTop();
            ctrl.direction == 'up' && scroll.toBottom();
        });

        // Watches
        ctrl.$watchMany(['config.orderBy', 'config.query'], function(pre,post){
            // Dont listen for changes until data has initialized
            // Dont add results if not ready or query is being initialized
            if(!$scope.ready || ((ctrl.config.query === '' && _.isUndefined(prevSearch)) && pre == post)) return;

            // Save previous search
            prevSearch = ctrl.config.query;

            // If either of these changes, all data must be pulled again
            ctrl.config.items = [];
            $scope.reset();

            // If there is a query, show the no more results block
            if(ctrl.config.query !== '') $scope.on_first_page = false;

            // Re-pull
            $scope.addResults();
        });

        // Default One-way bind values
        if(_.isUndefined(ctrl.config.loadingMessage)) ctrl.config.loadingMessage = "Loading items";
        if(_.isUndefined(ctrl.config.pageMessage)) ctrl.config.pageMessage = "Load more";
        if(_.isUndefined(ctrl.config.errorMessage)) ctrl.config.errorMessage = "There was a problem retreiving items.";
        if(_.isUndefined(ctrl.config.noMoreMessage)) ctrl.config.noMoreMessage = "No more items to display";

        $scope.reset();

        scroll.element.style.overflowY = "scroll";
        scroll.element.style.height = "100%";

        init.readyToInit = true;
    };

    $scope.reset = function(){
        // Initialize lastKey
        ctrl.config.lastKey = '';

        // Initialize Scope Flags
        $scope.noMore = false;
        $scope.loadingPage = false;
        $scope.paginateError = false;
        $scope.on_first_page = true;
    }

    ctrl.$onDestroy = function(){
        scroll.bind(true); // Unbind scroll
    };

    var scroll = {
        old : 0, // Old scroll container height
        artificial : false,
        toTop : function(){
            scroll.artificial = true;
            scroll.element.scrollTop = 0;
        },
        toBottom : function(){
            scroll.artificial = true;
            scroll.element.scrollTop = 1000000;
        },
        set : function(){
            if(ctrl.direction == 'down') return;
            scroll.artificial = true;
            scroll.element.scrollTop = (scroll.height - scroll.old);
        },
        bind : function(justUnbind){
            angular.element(scroll.element).unbind('scroll');
            _.isUndefined(justUnbind) && angular.element(scroll.element).bind('scroll', function(e){
                // Dont trigger on artificial scrolls
                if(scroll.artificial){
                    scroll.artificial = false;
                    return;
                }

                // If there are no more results, dont do anything!
                if($scope.noMore) return;

                // Direction is up and scroll has reached top
                if($scope.tscroll && !scroll.element.scrollTop) $scope.$evalAsync($scope.addResults);

                // Direction is down and scroll has reached bottom
                else if($scope.bscroll && scroll.element.scrollTop + $(scroll.element).innerHeight() >= scroll.height) $scope.$evalAsync($scope.addResults);
            });
        }
    };

    Object.defineProperty(scroll, 'element', { get : function(){return $element[0].firstChild;}}) // Element is a dynamic property
    Object.defineProperty(scroll, 'height', { get : function(){return scroll.element.scrollHeight;}}) // Element is a dynamic property

    // Externally accessible Functions
    ctrl.config.toBottom = function(){ scroll.toBottom(); }; // must stay anonymously wrapped
    ctrl.config.toTop = function(){ scroll.toTop(); }; // must stay anonymously wrapped
    ctrl.config.reset = function(){
        scroll.artificial = true;
        ctrl.config.items = [];
        $scope.reset();
        if(!init.readyToInit){
            return $timeout(ctrl.config.reset,200);
        }

        $timeout($scope.addResults).then(function(r){
            init.initializing = false;
            init.initialized = (r.status == 200);
        });
    }
    ctrl.config.init = function(){
        // If already initialized, or currently initializing, stop.
        if(init.initialized || init.initializing) return;
        // We are now initializing
        init.initializing = true;
        ctrl.config.reset();
    }
};

paginateController.$inject = paginateControllerDeps;

angular.module('paginate',[])
.component('paginate', {
    transclude: true,
    bindings: {
        config : '=',
        type : '@', // Type of pagination: click or scroll
        direction : '@', // Direction of scrolling: up or down
        pageFunc : '&',
    },
    templateUrl: 'paginateTemplate.html',
    controller : paginateController
})
