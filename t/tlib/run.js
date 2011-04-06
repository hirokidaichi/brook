function nextTest() {
    var files = JSON.parse(phantom.state);
    if (files.length > 1) {
        files.shift();
        phantom.state = JSON.stringify(files);
        phantom.open(files[0]);
    } else {
        phantom.exit(0);
    }
}

function qunitWatcher() {
    var el = document.getElementById('qunit-testresult');
    var failed;

    if (el && el.innerText.match('completed')) {
        console.log(el.innerText.replace(/^/mg, '  '));
        try {
            failed = el.getElementsByClassName('failed')[0].innerHTML;
        } catch (e) {
            ;
        }

        if (parseInt(failed, 10) == 0) {
            nextTest();
        } else {
            phantom.exit(1);
        }
    }
}


if (! phantom.state) {
    var files = phantom.args;
    phantom.state = JSON.stringify(files);
    phantom.open(files[0]);
} else {
    console.log(location.href);
    setInterval(qunitWatcher, 100);
}
