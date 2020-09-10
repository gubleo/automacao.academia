class Acesso extends EndPoint {

    constructor(params) {
        super();
        this.AbrirRecurso('html/acesso.html').then(value => {
            params.page.innerHTML = value.toString();
            this.submeter = document.getElementById('btnacesso');
            this.submeter.addEventListener('click', this.SolicitaLogin);
            window.dispatchEvent(new CustomEvent('AoCaregarLoginPage', {}));
        });
    }

    SolicitaLogin() {



        let usuario = document.getElementById('usuario').value;
        let senha = document.getElementById('senha').value;


        // let usuario = 'oberdan';
        // let senha = 'yu45thn@';

        let message = new window.messages();

        if (usuario === null || usuario.length < 5) {
            message.alert('Atenção', 'Informe corretamente o seu nome de usuário e senha');
            return;
        }

        if (senha === null || senha.length < 5) {
            message.alert('Atenção', 'Informe corretamente a senha de acesso');
            return;
        }

        window.dispatchEvent(new CustomEvent('AntesdeLogar', {}));

        $.ajax({
            type: 'POST',
            url: '/condominio/rpc/gymlogin',
            dataType: 'json',
            headers: {
                Prefer: 'params=single-object',
                Accept: 'application/vnd.pgrst.object+json'
            },
            success: function (response) {
                window.usuario = usuario;
                window.dispatchEvent(new CustomEvent('AoLogar', {
                    detail: {unidade: response, usuario: usuario}
                }));
            }.bind(this),
            data: {usuario: usuario, pass: senha}
        }).fail(function (jqXHR) {
            message.alert('Atenção', jqXHR.responseJSON.message);
            console.error(jqXHR);
        });
    }
}