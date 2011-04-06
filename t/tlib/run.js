function setState(obj) {
    phantom.state = JSON.stringify(obj);
}

function getState() {
    if (phantom.state) {
        return JSON.parse(phantom.state);
    } else {
        return null;
    }
}

function nextTest(passed, failed) {
    var state = getState();
    var files = state.files;

    files.shift();
    var state = {
        files: files,
        passed: state.passed + passed,
        failed: state.failed + failed
    };

    if (files[0]) {
        setState(state);
        phantom.open(files[0]);
    } else {
        console.log([ state.passed, 'tests of',
                      state.passed + state.failed,
                      'passed,',
                      state.failed,
                      'failed.' ].join(' '));
        phantom.exit(state.failed > 0);
    }
}

function qunitWatcher() {
    var el = document.getElementById('qunit-testresult');
    var passed, total, failed;

    if (el && el.innerText.match('completed')) {
        try {
            failed = el.getElementsByClassName('failed')[0].innerHTML;
        } catch (e) {
            ;
        }

        var argv = ['passed', 'failed'].map(function (s) {
            var html = el.getElementsByClassName(s)[0].innerHTML;
            return parseInt(html, 10);
        });
        console.log(argv.join('\t') + '\t' + location.href);
        nextTest.apply(null, argv);
    }
}

if (! getState()) {
    var files = phantom.args;
    setState({ files: files });

    console.log('Passed\tFailed');
    phantom.open(files[0]);
} else {
    setInterval(qunitWatcher, 100);
}
