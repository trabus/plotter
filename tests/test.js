/**
 * plotter
 *
 *    Library test
 */

define([
  'intern!bdd',
  'intern/chai!expect',
  'lib/plotter',
], function (bdd, expect, Plotter) {
  with(bdd) {

    describe('Newschool amd library', function() {
      it('returns an object', function() {
        var result = new Plotter();
        expect(typeof result).to.equal('object');
      })
    })

  }
})
