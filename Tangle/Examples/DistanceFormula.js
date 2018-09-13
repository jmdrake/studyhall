//
//  CookieExample.js
//  Tangle
//
//  Created by Bret Victor on 6/10/11.
//  (c) 2011 Bret Victor.  MIT open-source license.
//

window.addEvent('domready', function () {

    var model = {
        initialize: function () {
            this.Ax = 1;
            this.Ay = 0;
            this.Bx = 5;
            this.By = 7;
        },
        update: function () {
            this.Distance = Math.sqrt(Math.pow((this.Ax - this.Bx), 2) + Math.pow((this.Ay - this.By), 2));
            this.Mx = (this.Ax+this.Bx)/2.0;
            this.My = (this.Ay+this.By)/2.0
        }
    };
    
    for (var i = 1; ; i++) {
        var id = "distanceExample" + ((i > 1) ? i : "");
        var element = document.getElementById(id);
        if (!element) { break; }
        new Tangle(element,model);
    }
    
});
