/**!
 * jquery.fancytree.contextmenu.js
 *
 * Integrate the 'jQuery contextMenu' plugin as Fancytree extension:
 * https://github.com/swisnl/jQuery-contextMenu
 *
 * Copyright (c) 2008-2018, Martin Wendt (https://wwWendt.de)
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 */
(function($, document) {
	"use strict";

	var initContextMenu = function(tree, selector, menu_file, menu_folder, menu_back, actions) {
	    tree.$container.on("mousedown.contextMenu", function(event) {


			if (event.which == 3) {
			    var node = $.ui.fancytree.getNode(event);
				$.contextMenu("destroy", "." + selector);

                $.contextMenu({
					selector: "." + selector,
					events: {
						show: function(options) {
							options.prevKeyboard = tree.options.keyboard;
							tree.options.keyboard = false;
						},
						hide: function(options) {
						    if(node) {
                                tree.options.keyboard = options.prevKeyboard;
                                node.setFocus(true);
						    }
						},
					},
					build: function($trigger, e) {
						var bnode = $.ui.fancytree.getNode($trigger);

						var menuItems = {};
						if(node) {
                            if(node.folder == true) {
                                if ($.isFunction(menu_folder)) {
                                    menuItems = menu_folder(bnode);
                                } else if ($.isPlainObject(menu_folder)) {
                                    menuItems = menu_folder;
                                }
                            } else {
                                if ($.isFunction(menu_file)) {
                                    menuItems = menu_file(node);
                                } else if ($.isPlainObject(menu_file)) {
                                    menuItems = menu_file;
                                }
                            }
						} else {
                            if ($.isPlainObject(menu_back)) {
                                menuItems = menu_back;
                            }
						}

						return {
							callback: function(action, options) {
								if ($.isFunction(actions)) {
									actions(node, action, options, menuItems);
								} else if ($.isPlainObject(actions)) {
									if (
										actions.hasOwnProperty(action) &&
										$.isFunction(actions[action])
									) {
										actions[action](node, options);
									}
								}
							},
							items: menuItems,
						};
					},
				});

				if(node) {
					node.setFocus(true);
					node.setActive(true);
				}
			}
		});
	};

	$.ui.fancytree.registerExtension({
		name: "contextMenu",
		version: "@VERSION",
		contextMenu: {
			selector: "fancytree-title",
			menu: {},
			actions: {},
		},
		treeInit: function(ctx) {
			this._superApply(arguments);
			initContextMenu(
				ctx.tree,
				ctx.options.contextMenu.selector || "fancytree-title",
				ctx.options.contextMenu.menu_file,
				ctx.options.contextMenu.menu_folder,
				ctx.options.contextMenu.menu_back,
				ctx.options.contextMenu.actions
			);
		},
	});
})(jQuery, document);
