var Modeler = (typeof window !== 'undefined' && window !== null) 
  ? require('fendjs-model') : require(process.env.FENDJS_MODEL ? '../lib-cov/' : '../lib/');
var assert = require('assert');

var User = Modeler('User')
  .attr('id', { type: 'number' })
  .attr('name', { type: 'string' })
  .attr('age', { type: 'number' });

function required (attr) {
  return function (Model) {
    Model.validate(function (model) {
      if (!model.has(attr)) model.error(attr, 'field required');
    });
  }
}

var Pet = Modeler('Pet')
  .attr('id')
  .attr('name')
  .attr('species')
  .use(required('name'));


describe('new Model(object)', function () {
  it('should populate attrs', function () {
    var user = new User({ name: 'Tobi', age: 2 });
    assert('Tobi' == user.name());
    assert(2 == user.age());
  })

  it('should emit "construct" event', function (done) {
    User.on('construct', function (user, attrs) {
      assert('Tobi' == user.name());
      assert('Tobi' == attrs.name);
      User.off('construct');
      done();
    });
    new User({ name: 'Tobi' });
  })
})

describe('Model(object)', function () {
  it('should populate attrs', function () {
    var user = User({ name: 'Tobi', age: 2 });
    assert('Tobi' == user.name());
    assert(2 == user.age());
  })
})

describe('Model#.<attr>(value)', function () {
  it('should set a value', function () {
    var user = new User;
    assert(user == user.name('Tobi'));
    assert('Tobi' == user.name());
  })

  it('should emit "change <attr>" events', function (done) {
    var user = new User({ name: 'Tobi' });

    user.on('change name', function (val, old) {
      assert('Luna' == val);
      assert('Tobi' == old);
      done();
    });

    user.name('Luna');
  })

  it('should emit "change" events', function (done) {
    var user = new User({ name: 'Tobi' });

    user.on('change', function (prop, val, old) {
      assert('name' == prop);
      assert('Luna' == val);
      assert('Tobi' == old);
      done();
    });

    user.name('Luna');
  })
})

describe('Model#isNew()', function () {
  it('should default to true', function () {
    var user = new User;
    assert(true === user.isNew());
  })

  it('should be false when a primary key is present', function () {
    var user = new User({ id: 0 });
    assert(false === user.isNew());
  })
})

describe('Model#isValid()', function () {
  var User = Modeler('User')
    .attr('name')
    .attr('email');

  User.validate(function (user) {
    if (!user.has('name')) user.error('name', 'name is required');
  });

  User.validate(function (user) {
    if (!user.has('email')) user.error('email', 'email is required');
  });

  it('should populate .errors', function () {
    var user = new User;
    assert(false === user.isValid());
    assert(2 == user.errors.length);
    assert('name' == user.errors[0].attr);
    assert('name is required' == user.errors[0].message);
    assert('email' == user.errors[1].attr);
    assert('email is required' == user.errors[1].message);
  })

  it('should return false until valid', function () {
    var user = new User;
    assert(false === user.isValid());
    assert(2 == user.errors.length);

    user.name('Tobi');
    assert(false === user.isValid());
    assert(1 == user.errors.length);

    user.email('tobi@learnboost.com');
    assert(true === user.isValid());
    assert(0 == user.errors.length);
  })
})

describe('Model#model', function () {
  it('should reference the constructor', function () {
    var user = new User;
    assert(User == user.Model);

    var pet = new Pet;
    assert(Pet == pet.Model);
  })
})

describe('Model#set(attrs)', function () {
  it('should set several attrs', function () {
    var user = new User;
    user.set({ name: 'Tobi', age: 2 });
    assert('Tobi' == user.name());
    assert(2 == user.age());
  })
})

describe('Model#get(attr)', function () {
  it('should return an attr value', function () {
    var user = new User({ name: 'Tobi' });
    assert('Tobi' == user.get('name'));
  })
})

describe('Model#has(attr)', function () {
  it('should check if attr is not null or undefined', function () {
    var user = new User({ name: 'Tobi' });
    assert(true === user.has('name'));
    assert(false === user.has('age'));
  })
})

describe('Model#toJSON()', function () {
  it('should return the attributes', function () {
    var user = new User({ name: 'Tobi', age: 2 });
    var obj = user.toJSON();
    assert('Tobi' == obj.name);
    assert(2 == obj.age);
  })
})

describe('Model#save(fn)', function(){
  describe('when new', function () {
    describe('and valid', function () {
      it('should save', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        pet.save(function () {
          assert(pet.id());
          done();
        });
      })

      it('should emit "saving"', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        pet.on('saving', function () {
          assert(pet.isNew());
          done();
        });
        pet.save();
      })

      it('should emit "saving" on the constructor', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        Pet.once('saving', function (obj) {
          assert(pet == obj);
          done();
        });
        pet.save();
      })

      it('should emit "save"', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        pet.on('save', done);
        pet.save();
      })

      it('should emit "save" on the constructor', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        Pet.once('save', function (obj) {
          assert(pet == obj);
          done();
        });
        pet.save();
      })
    })

    describe('and invalid', function () {
      it('should error', function (done) {
        var pet = new Pet;
        pet.save(function (err) {
          assert('validation failed' == err.message);
          assert(1 == pet.errors.length);
          assert('name' == pet.errors[0].attr);
          assert('field required' == pet.errors[0].message);
          assert(null == pet.id());
          done();
        });
      })
    })
  })

  describe('when old', function () {
    describe('and valid', function () {
      it('should save', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        pet.save(function () {
          var id = pet.id();
          assert(id);
          pet.name('Loki');
          pet.save(function () {
            assert(id == pet.id());
            Pet.get(id, function (err, pet) {
              assert(id == pet.id());
              assert('Loki' == pet.name());
              done();
            });
          });
        });
      })

      it('should emit "saving"', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        pet.save(function (err) {
          assert(!err);
          pet.on('saving', done);
          pet.save();
        });
      })

      it('should emit "saving" on the constructor', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        pet.save(function () {
          Pet.once('saving', function (obj) {
            assert(pet == obj);
            done();
          });
          pet.save();
        });
      })

      it('should emit "save"', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        pet.save(function (err) {
          assert(!err);
          pet.on('save', done);
          pet.save();
        });
      })

      it('should emit "save" on the constructor', function (done) {
        var pet = new Pet({ name: 'Tobi', species: 'Ferret' });
        pet.save(function (err) {
          assert(!err);
          Pet.once('save', function (obj) {
            assert(pet == obj);
            done();
          });
          pet.save();
        });
      })
    })

    describe('and invalid', function () {
      it('should error', function (done) {
        var pet = new Pet({ name: 'Tobi' });
        pet.save(function (err) {
          assert(!err);
          pet.name(null);
          pet.save(function (err) {
            assert('validation failed' == err.message);
            assert(1 == pet.errors.length);
            assert('name' == pet.errors[0].attr);
            assert('field required' == pet.errors[0].message);
            assert(pet.id());
            done();
          });
        });
      })
    })
  })
})

describe('Model#destroy()', function () {
  describe('when new', function () {
    it('should error', function (done) {
      var pet = new Pet;
      pet.destroy(function (err) {
        assert('not saved' == err.message);
        done();
      });
    })
  })

  describe('when old', function () {
    it('should destroy', function (done) {
      var pet = new Pet({ name: 'Tobi' });
      pet.save(function (err) {
        assert(!err);
        pet.destroy(function (err) {
          assert(!err);
          assert(pet.destroyed);
          done();
        });
      });
    })

    it('should emit "destroy"', function (done) {
      var pet = new Pet({ name: 'Tobi' });
      pet.save(function (err) {
        assert(!err);
        pet.on('destroy', done);
        pet.destroy();
      });
    })

    it('should emit "destroying" on the constructor', function (done) {
      var pet = new Pet({ name: 'Tobi' });
      pet.save(function (err) {
        assert(!err);
        Pet.once('destroying', function (obj) {
          assert(pet == obj);
          done();
        });
        pet.destroy();
      });
    })

    it('should emit "destroy"', function (done) {
      var pet = new Pet({ name: 'Tobi' });
      pet.save(function (err) {
        assert(!err);
        pet.on('destroy', done);
        pet.destroy();
      });
    })

    it('should emit "destroy" on the constructor', function (done) {
      var pet = new Pet({ name: 'Tobi' });
      pet.save(function (err) {
        assert(!err);
        Pet.once('destroy', function (obj) {
          assert(pet == obj);
          done();
        });
        pet.destroy();
      });
    })
  })
})

describe('Model#changed(attr)', function () {
  describe('no dirty', function () {
    it('should return "false"', function () {
      var pet = new Pet();
      assert(!pet.changed());
    });
  });

  describe('dirty', function () {
    describe('no specify attr', function () {
      it('should return dirty object', function () {
        var pet = new Pet({ name: 'Tobi' });
        var obj = pet.changed();
        assert(obj.name === 'Tobi');
      });
    });

    describe('specify attr', function () {
      it('should return bool value', function () {
        var pet = new Pet({ name: 'Tobi' });
        assert(true === pet.changed('name'));
      });
    });
  });
})
