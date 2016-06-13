# angular-paginate

Flexible pagination component for Angular applications.

## Implementation

For this component to function properly, implementations should follow this procedure closely.

### JavaScript

The angular implementation for this component is simple. Declare the paginate config object to set things up

    $scope.paginate = {
        id : 'test_paginate', // Name your paginate instance - this allows you to send it events for example scrollToBottom
        items : [], // Your main content array, this should start empty
        pageFunc : function(){
            return messageEndpoints.getPage(ctrl.room, $scope.paginate.lastKey, $scope.paginate.orderBy, $scope.paginate.query);
        }, // A function for getting more results based on $scope.paginate.lastKey, $scope.paginate.orderBy, $scope.paginate.query
    }

#### Options

There are a number of optional paginate configuration settings:

    loadingMessage -> A string to display when loading new items
    pageMessage    -> The string displayed on the button for loading more messages (in click mode only)
    errorMessage   -> A message that is displayed when errors occur
    noMoreMessage  -> A message that is displayed when there are no more items to fetch

    query          -> This is the variable that should be used on search text inputs [ng-model="paginate.query"].
                      Angular-paginate will listen for changes in this variable and reload items accordingly

    orderBy        -> This is the property used for sorting, Angular-paginate will fetch new results when this changes

#### Page Function

The most important piece in the implementation of this component is the page function or 'pageFunc'. This function must return
a promise object that is resolved inside the component. Here is an example:

    endpoint.getPage = function(room, lastKey) {
        return $http.get(endpoint.url_prefix + '/roompage/' + room.key + '/' + lastKey);
    };

This function is very important because it fetches the data that is being paginated. You never have to call this function as
it is called automatically by the component.

#### Give It Orders

Because we named the instance of angular-paginate, we have the ability to send it commands from other places like far away controllers. We accomplish this using events.

Here is an example that tells our paginate instance to scroll to the bottom:

    $rootScope.$broadcast('paginate', {id : 'test_paginate', method : 'bottom'});

Make sure to include the 'id' and 'method' properties in the event data. Currently the following methods exist:

- **bottom** : scroll to the bottom of the paginate instance
- **top** : scroll to the top of the paginate instance
- **forcePage** : force the addition of another page
- **reset** :  reset the contents and state of the paginate instance

#### Finishing up

When everything is set up in your controller, call `$scope.paginate.reset();` to initialize the component. This can also
be called whenever you want to force a reload of the data. In messages this is used whenever a different room is selected.

### HTML

Angular-paginate currently supports two types of pagination schemes; click and scroll. Select a scheme by setting the
type attribute to either 'click' or 'scroll'. The direction attribute selects whether the scroll progression is upward
or downward. Set the direction attribute to 'up' or 'down' to choose the functionality.

    <!-- Supply the config object ($scope.paginate in this case), the page function, type and direction -->
    <paginate config="paginate" page-func="paginate.pageFunc()" type="scroll" direction="up">
        <!-- Here you can have a regular ng-repeat using the paginate.items array for content -->
        <div class="grid-block vertical" ng-repeat="message in paginate.items | orderBy:'+created_at'">
            {{message.content}}
        </div>
    </paginate>
