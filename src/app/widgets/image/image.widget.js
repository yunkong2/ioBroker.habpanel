(function() {
    'use strict';

    angular
        .module('app.widgets')
        .directive('widgetImage', widgetImage)
        .controller('WidgetSettingsCtrl-image', WidgetSettingsCtrlImage)
        .config(function (WidgetsProvider) { 
            WidgetsProvider.$get().registerType({
                type: 'image',
                displayName: 'Image',
                icon: 'picture',
                description: 'Displays an image (not necessarily from own server)'
            });
        });

    widgetImage.$inject = ['$rootScope', '$uibModal', 'OHService'];
    function widgetImage($rootScope, $modal, OHService) {
        // Usage: <widget-image ng-model="widget" />
        //
        // Creates: A image widget
        //
        var directive = {
            bindToController: true,
            controller: ImageController,
            controllerAs: 'vm',
            link: link,
            restrict: 'AE',
            templateUrl: 'app/widgets/image/image.tpl.html',
            scope: {
                ngModel: '='
            }
        };
        return directive;
        
        function link(scope, element, attrs) {
        }
    }
    ImageController.$inject = ['$rootScope', '$scope', 'OHService', '$interval', '$sce'];
    function ImageController ($rootScope, $scope, OHService, $interval, $sce) {
        var vm = this;
        this.widget = this.ngModel;

        function updateValue() {
            var item = OHService.getItem(vm.widget.item);
            if (!item || vm.widget.image_source !== 'item' || item.type !== "String") {
                vm.value = "";
                return;
            }
            vm.url = $sce.trustAsResourceUrl(item.state);
        }

        OHService.onUpdate($scope, vm.widget.item, function () {
            updateValue();
        });
        
        if (!this.widget.image_source || this.widget.image_source === 'static') {
            vm.original_url = vm.url = this.widget.url;
        }

        var intervaltype = vm.intervaltype = this.widget.intervaltype || 'seconds';
        
        if (vm.widget.refresh) {
            var _interval = intervaltype === 'seconds' ? this.widget.refresh * 1000 : this.widget.refresh;
            var imgRefresh = $interval(function () {
                var timestamp = (new Date()).toISOString();

                vm.url = (vm.original_url.indexOf('?') === -1) ?
                        vm.original_url + "?_t=" + timestamp : vm.original_url + "&_t=" + timestamp;
            }, _interval, 0, true);

            $scope.$on('$destroy', function (event) {
                $interval.cancel(imgRefresh);
            });
        }

    }


    // settings dialog
    WidgetSettingsCtrlImage.$inject = ['$scope', '$timeout', '$rootScope', '$uibModalInstance', 'widget', 'OHService'];

    function WidgetSettingsCtrlImage($scope, $timeout, $rootScope, $modalInstance, widget, OHService) {
        $scope.widget = widget;
        // $scope.items = OHService.getItems();

        $scope.form = {
            name        : widget.name,
            sizeX       : widget.sizeX,
            sizeY       : widget.sizeY,
            col         : widget.col,
            row         : widget.row,
            image_source: widget.image_source || 'static',
            url         : widget.url,
            item        : widget.item,
            refresh     : widget.refresh,
            intervaltype: widget.intervaltype || 'seconds'
        };
        
        $scope.$watch('form.item', function (item, oldItem) {
            if (item === oldItem) {
                return;
            }
            OHService.getObject(item).then(function (obj) {
                if (obj && obj.common) {
                    if (obj.common.name) {
                        $scope.form.name = obj.common.name;
                    }
                }
            });
        });
        
        $scope.dismiss = function() {
            $modalInstance.dismiss();
        };

        $scope.remove = function() {
            $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
            $modalInstance.close();
        };

        $scope.submit = function() {
            angular.extend(widget, $scope.form);
            switch (widget.image_source) {
                case "item":
                    delete widget.action_type;
                    break;
                default:
                    delete widget.item;
                    delete widget.action_type;
                    break;
            }

            $modalInstance.close(widget);
        };

    }


})();