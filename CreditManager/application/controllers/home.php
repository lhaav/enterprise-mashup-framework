<?php 

if (! defined('BASEPATH')) exit('No direct script access allowed');

class Home extends CI_Controller {

  private $data;

  public function Home() {
    parent::__construct();

    if ($this->session->userdata('id')) {
      redirect('user');
    }
    
    // Field validation
    $this->load->library('form_validation');
    $this->form_validation->set_error_delimiters('<p class="error">', '</p>');
    
    $this->data['page_title'] = 'Credit Management ';
    $this->data['right'] = $this->load->view('home/right_view', '', true);

    // IE PNG fix CSS class
    $this->data['pngfix'] = strlen($this->uri->segment(1)) > 0 ? 'pngfix2' : 'pngfix';
  }
  
  public function index() {
    $this->data['page_title'] .= '&gt; Main';
    $this->data['content'] = $this->load->view('home/main_view', '', true);
    $this->load->view('home/layout_view', $this->data);
  }
  
  /**
  * Check for login data, if correct, user is redirected to password protected area
  */
  public function login() {
    parent::__construct();

    if ($this->session->userdata('id')) {
      redirect('user');
    }
    
    // Field validation
    $this->load->library('form_validation');
    $this->form_validation->set_error_delimiters('<p class="error">', '</p>');

    // IE PNG fix CSS klass
    $this->data['pngfix'] = strlen($this->uri->segment(1)) > 0 ? 'pngfix2' : 'pngfix';

    // Field validation
    $this->form_validation->set_rules('email', 'email', 'required|valid_email|callback__logincheck');
    $this->form_validation->set_rules('password', 'password', 'required');
    $this->form_validation->set_message('required', 'Field <b>%s</b> is required');
    $this->form_validation->set_message('valid_email', 'Please enter a valid email address');
    
    // Successful login
    if ($this->form_validation->run()) {
      $userID = $this->account_model->getUserID($this->input->post('email'));
      $userType = $this->account_model->getUserType($userID);

      $userSessionData = array(
        'id'  => $userID,  
        'email' => $this->input->post('email'),
        'type'  => $userType
      );

      $this->session->set_userdata($userSessionData);
      
      // Redirect to password protected area
      redirect(site_url('user'));
    }  

    // Unsuccessful login
    $this->data['page_title'] .= '&gt; Login invalid';
    $this->data['content'] = $this->load->view('home/login_invalid_view', '', true);
    $this->data['right'] = $this->load->view('home/right_view', '', true);
    $this->load->view('home/layout_view', $this->data);
  }
  
  /**
  * Checks whether user exists in database
  *
  * @return boolean true, if user exists, false otherwise
  */
  public function _logincheck() {
    $this->load->model('account_model');

    if ($this->account_model->checkLoginData($this->input->post('email'), sha1($this->input->post('password')))) {
      return true;
    }

    $this->form_validation->set_message('_logincheck', 'Username and password do not match');
    
    return false;
  }

  /**
  * User registration
  */
  public function register() {
    parent::__construct();

    if ($this->session->userdata('id')) {
      redirect('user');
    }
    
    // Field validation
    $this->load->library('form_validation');
    $this->form_validation->set_error_delimiters('<p class="error">', '</p>');
    $this->form_validation->set_rules('reg_email', 'e-mail', 'required|valid_email|callback__registrationcheck');
    $this->form_validation->set_rules('reg_password', 'password', 'required|matches[reg_password2]');
    $this->form_validation->set_rules('reg_password2', 're-enter password', 'required');
    $this->form_validation->set_message('required', 'Field <b>%s</b> is required');
    $this->form_validation->set_message('valid_email', 'Please enter a valid email address');
    $this->form_validation->set_message('matches', 'Passwords do not match');
    
    // If registration can be done
    if ($this->form_validation->run()) {
      $activationcode  = sha1($this->input->post('reg_email') . time());
      $timestamp      = date('Y-m-d H:i:s');

      $data = array(
        'email'    => $this->input->post('reg_email'),
        'password' => sha1($this->input->post('reg_password')),
        'type'     => $this->config->item('default_account'),
        'registrationdate' => $timestamp,
        'activationcode'   => $activationcode
      );

      $this->account_model->register($data);
      
      // Send activation link e-mail
      $this->load->library('email');
      echo $this->config->item('reg_email'); 
      $this->email->from($this->config->item('reg_email'), $this->config->item('reg_name'));
      $this->email->to( $this->input->post('reg_email') );
      $this->email->subject($this->config->item('reg_subject'));
      $this->email->message(
'Hi,

Thank you for submitting your registration information to the CreditManager.
To complete your registration please click on this link to activate your account:

' . $this->config->item('base_url') . 'home/activate/' . $activationcode . '

Thanks from, 
' . $this->config->item('reg_name'));

      $this->email->send();

      redirect('home/registered');
    }

    $this->data['page_title'] .= '&gt; Registration';
    $this->data['content'] = $this->load->view('home/registration_view', '', true);
    $this->data['right'] = $this->load->view('home/right_registration_view', '', true);

    // IE PNG fix CSS class
    $this->data['pngfix'] = strlen($this->uri->segment(1)) > 0 ? 'pngfix2' : 'pngfix';

    $this->load->view('home/layout_view', $this->data);
  }

  /**
  * Checks whether such user has already registered
  *
  * @return boolean true, if user can register, otherwise false
  */
  public function _registrationcheck() {
    $this->load->model('account_model');

    if (!$this->account_model->isAccountAvailable($this->input->post('reg_email'))) {
      $this->form_validation->set_message('_registrationcheck', 
                        'An account with this e-mail address <b>' . $this->input->post('reg_email') . '</b> has already bee activated.<br /><br />If this is your e-mail address try logging in.');
      return false;
    }
    
    return true;
  }

  /**
  * Notification for user that account activation link has been sent
  */
  public function registered() {
    $this->data['page_title'] .= '&gt; Registration successful';
    $this->data['content'] = $this->load->view('home/registered_view', '', true);

    $this->load->view('home/layout_view', $this->data);
  }  
  
  /**
  * Account activation
  */
  public function activate($activationcode) {
    $this->load->model('account_model');

    // Check if activation successful
    if ($this->account_model->activate($activationcode)) {
      $this->data['page_title'] .= '&gt; Account activated';
      $this->data['content'] = $this->load->view('home/activated_view', '', true);
      $this->load->view('home/layout_view', $this->data);
    }
    else {
      $this->data['page_title'] .= '&gt; Account activation failed';
      $this->data['content'] = $this->load->view('home/activation_failed_view', '', true);
      $this->load->view('home/layout_view', $this->data);
    }
  }
}