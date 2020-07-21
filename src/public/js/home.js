class Home extends EndPoint{

constructor(params) {
    super();

    this.AbrirRecurso('html/home.html').then(value => {
        params.page.innerHTML = value.toString();
        window.dispatchEvent(new CustomEvent('AoCaregarHome', {}));
    });
}

}