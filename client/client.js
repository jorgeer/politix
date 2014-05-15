Template.dashboard.noUser = !Meteor.user();


Template.dashboard.hasName = function () {
    if (Meteor.user() && Meteor.user().profile)
        return Meteor.user().profile.name;
    return false;
};

Template.dashboard.noName = function() { return !Template.dashboard.hasName(); };

Template.dashboard.hasCorporation = function () {
    if (Meteor.user())
        return Meteor.user().corporation;
    return false;
};

Template.dashboard.noCorporation = function() { return !Template.dashboard.hasCorporation(); };

Template.dashboard.rendered = function () {

    $(".main").height($(window).height());
};


Template.navList.rendered = function () {

    if (!this.rendered) {
        console.log("Adding dragging listener");
        $(".drag-component").drags({ handle: ".panel-heading" });

        $(".panel").click(function () {
            Session.set("panelOrder", Session.get("panelOrder")+1);
            $(this).css("z-index", Session.get("panelOrder"));
        });

        this.rendered = true;
    }
};

Template.dashboard.events({
    "click .close-btn": function (e) {
        var frame = $(e.target).attr("view");
        $("."+frame).hide();
    },
    "click .min-btn": function (e) {
        var $btn = $(e.target),
            view = $btn.attr("view"),
            minimized = $btn.attr("min") === "true",
            $view = $("."+view);

        if (minimized) {
            $view.css("height", $view)
            .find(".panel-body").show();
            $btn.attr("min", "false");
        } else {
            $view.find(".panel-body").hide();
            $btn.attr("min", "true");
        }
    }
});


displayView = function (selector) {
    Session.set("panelOrder", Session.get("panelOrder") + 1);

    $(selector).css({
        "left": "50%",
        "z-index": Session.get("panelOrder")
    }).show();
};

hideView = function (selector) {

    $(selector).hide();
};

Meteor.startup(addDragsFunc);
Meteor.startup(contextMenu);

function contextMenu () {
    var $menu = $("#context-menu"),
        currentContext,

        contexts = {
            item: {
                actions: [
                    {
                        name: "Discard",
                        func: discardItem
                    },
                    {
                        name: "Sell",
                        func: createSellOrder
                    },
                    {
                        name: "Buy",
                        func: createBuyOrder
                    }
                ]
            },
            miner: {
                actions: [
                    {
                        name: "Dismantle",
                        func: null
                    },
                    {
                        name: "Repair",
                        func: null
                    }
                ]
            },
        };
        
    var $contextEl;

    var populateMenu = function (context) {
        $("#context-menu").find("ul").empty();

        for (var c = 0; c < context.length; c++) {
            
            var name = context[c];

            for (var i = 0; i < contexts[name].actions.length; i++) {
                $("#context-menu").find("ul").append($("<li data-action='"+contexts[name].actions[i].name+"'>"+contexts[name].actions[i].name+"</li>"));
            }
        }
    };

    var executeMenuAction = function (a, opts) {
        var action = _.find(contexts[currentContext].actions, function (el) {
            return el.name === a;
        });

        action.func($contextEl);
    };

    $(document).bind("contextmenu", function (event) {
        event.preventDefault();

        $contextEl = $(event.target).closest("[data-context]");
        currentContext = $contextEl.attr("data-context");

        if (currentContext) {

            currentContext.split(" ");

            if (!Array.isArray(currentContext)) {
                currentContext = [currentContext];
            }

            if (currentContext.length) {
                populateMenu(currentContext);
            }

            $("#context-menu").css({ top: event.pageY + "px", left: event.pageX + "px" }).show(50);

            $("#context-menu li").bind("click", function () {
                executeMenuAction($(this).attr("data-action"));
                $("#context-menu").hide();
            });


        } else {
            $("#context-menu").hide();
        }
        
        
    });


    $(document).bind("click", function (event) {
        if (!$(event.target).is("li"))
            $("#context-menu").hide();
    });
    
}

function addDragsFunc () {
    Session.set("panelOrder", 10);

    $.fn.drags = function(opt) {
        var $el, $drag,
            z_idx,drg_h,drg_w,targetX, targetY,
            w_width, w_height, pos_y, pos_x;

        opt = $.extend({ handle:"", cursor:"move" }, opt);

        if(opt.handle === "") {
            $el = this;
        } else {
            $el = this.find(opt.handle);
        }

        console.log(opt.handle + " should now be draggable");

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {

            Session.set("panelOrder", Session.get("panelOrder")+1);

            if(opt.handle === "") {
                $drag = $(this).addClass('draggable');
            } else {
                $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }

            z_idx = $drag.css('z-index');
            drg_h = $drag.outerHeight();
            drg_w = $drag.outerWidth();
            w_width = $(window).width();
            w_height = $(window).height();
            pos_y = $drag.offset().top + drg_h - e.pageY;
            pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                targetX = e.pageX + pos_x - drg_w;
                targetY = e.pageY + pos_y - drg_h;
                targetX = targetX < 0 ? 0 : targetX;
                targetY = targetY < 0 ? 0 : targetY;
                targetX = targetX > w_width - drg_w ? w_width - drg_w : targetX;
                targetY = targetY > w_height - drg_h ? w_height - drg_h : targetY;
                $('.draggable').offset({
                    top: targetY,
                    left: targetX
                }).on("mouseup", function() {
                    $(this).removeClass('draggable').css('z-index', Session.get("panelOrder"));
                });
            });
            e.preventDefault(); // disable selection
        }).on("mouseup", function() {
            if(opt.handle === "") {
                $(this).removeClass('draggable');
            } else {
                $(this).removeClass('active-handle').parent().removeClass('draggable');
                $(this).parents().unbind('mousemove');
            }
        });
    };
}