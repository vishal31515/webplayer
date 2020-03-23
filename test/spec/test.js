(function () {
  'use strict';

  describe('Give it some context', function () {
    describe('maybe a bit more context here', function () {
      it('should run here few assertions', function () {

      });

      it('should return -1 when the value is not present', function() {
          assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
  });
})();
