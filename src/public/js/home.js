class Home extends EndPoint{

constructor(params) {
    super();

    this.AbrirRecurso('html/home.html').then(value => {
        params.page.innerHTML = value.toString();
        
        document.getElementById('responsavel').innerText = params.unidade.responsavel;
        document.getElementById('bloco').innerText = params.unidade.bloco;
        document.getElementById('unidade').innerText = params.unidade.unidade;

        window.dispatchEvent(new CustomEvent('AoCaregarHome', {}));
    });
}

}