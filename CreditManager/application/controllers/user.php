<?php

class User extends CI_Controller {

  private $data;

  function User() {
    parent::__construct();

    if (!$this->session->userdata('id')) {
      redirect();
    }

    // Field validation
    $this->load->library('form_validation');
    $this->form_validation->set_error_delimiters('<p class="error">', '</p>');

    $this->data['page_title'] = 'Credit Management ';
    $this->data['right']  = $this->load->view('user/right_view', '', true);
    $this->data['user']   = $this->session->userdata('email');
    $this->data['mashup'] = '';

    $this->load->model('account_model');
    $this->data['usertype'] = $this->session->userdata('type');

    // IE PNG fix CSS class
    $this->data['pngfix'] = strlen($this->uri->segment(1)) > 0 ? 'pngfix2' : 'pngfix';
  }

  public function index() {
    $this->data['page_title'] .= '&gt; Main';

    $this->load->model('flowsessions_model');
    $table['flowsessions'] = $this->flowsessions_model->getFlowSessions('');

    $this->load->model('account_model');
    $accountType = $this->session->userdata('type');
    $table['accounts'] = $this->account_model->getUsersByType($this->config->item('default_account'));

    if ($accountType == 'consultant') {
      $table['mode'] = '';
    } else {
      $table['mode'] = 'full';
    }

    $this->data['content'] = $this->load->view('user/main_view', $table, true);
    if ($accountType == 'consultant') {
      $this->data['right'] = $this->load->view('user/right_view', $table, true);
    } else {
      $this->data['right'] = '';
    }
    
    $this->load->view('user/layout_view', $this->data);
  }
  
  /**
  * Mashup area
  */
  public function mashup($message = '') {
    parent::__construct();

    if (!$this->session->userdata('id')) {
      redirect();
    }

    $table['mashupID'] = $message;
    $table['username'] = $this->session->userdata('email');
    $table['usertype'] = $this->session->userdata('type');  

    $this->data['page_title'] .= '&gt; Mashup';
    $this->data['content'] = '';
    $this->data['right'] = '';
    $this->data['mashup'] = $this->load->view('user/middle_view', $table, true);
    $this->load->view('user/layout_view', $this->data);
  }

  /**
  * CSV file upload
  *
  * @return  void
  */
  public function uploadCSV() {
    $invoice['upload_path']   = './temp/'; // Upload folder
    $invoice['allowed_types'] = 'csv'; // Allowed file extension
    $invoice['file_name']     = md5(time() . $_FILES['file']['tmp_name']); // Random filename (w/o ext)
    $invoice['max_size']      = 2048; // Max file size KB

    $this->load->library('upload', $invoice);
    // Successful upload
    if ($this->upload->do_upload('file')) {
      echo json_encode(array('filenameunique' => $invoice['file_name']));
      $filepath = $invoice['upload_path'] . $invoice['file_name'] . '.csv';

      // Prepare Json
      $invoiceMessage = array();
      $invoices = $this->parseInvoices($filepath);
      $invoiceMessage['route'] = $invoices;
      $invoiceJson = json_encode($invoiceMessage);

      $this->load->model('mashup_model');
      $this->mashup_model->addMashupMessage($invoice['file_name'], $invoiceJson);

      // if contains invoices
      if ($invoices) {
        if (file_exists($filepath)) {
          unlink($filepath);
        }
      }
      // does not contain any invoices
      else {
        if (file_exists($filepath)) {
          unlink($filepath);
        }
        ?>
        <script type="text/javascript">
          alert("No invoices found.");
        </script>
        <?php
      }
    }
    // Unsuccessful upload
    else {
      ?>
      <script type="text/javascript">
        alert("Upload was unsuccessful!\n\n" +
            "Here are possible reasons:\n" +
            "\t - File should be in CSV format\n" +
            "\t - File size should not exceed 2MB");
      </script>
      <?php
    }
  }

  /**
  * Parsing CSV invoices file
  *
  * @param  string Path to invoice CSV file
  * @return  mixed  array invoices, if none then false
  */
  public function parseInvoices($filepath) {
    if (!is_readable($filepath)) return false;

    $handle = fopen($filepath, 'r');

    // 25 first symbols of first row to get field separator
    $symbols = fread($handle, 25);
    $separator = stripos($symbols, ';') ? ';' : ',';
    // Pointer back to beginning of file
    rewind($handle);

    // finding field positions
    $firstRow = fgetcsv($handle, 250, $separator);
    foreach ($firstRow as $position => $fieldName) {
      $columns[$position] = utf8_encode($fieldName);
    }

    $invoices = array();

    // Parsing file row by row. Maximum row length is 1024.
    $rowId = 1;
    while (($row = fgetcsv($handle, 1024, $separator)) !== false) {
      // Skip empty rows
      if (count($row) > 1) {
        $invoice = array();
        $invoice['ID'] = strval($rowId);
        foreach ($row as $position => $fieldValue) {
          $invoice[$columns[$position]] = utf8_encode($fieldValue);
        }
        $rowId++;
        $invoices[] = $invoice;
      }
    }

    fclose($handle);

    if ($invoices) {
      return $invoices;
    }
    return false;
  }

  /**
  * Add invoice to database (flow session)
  *
  * @return  void
  */
  public function addInvoice() {
    if ($this->input->post('filenameunique')) {
      $data = array(
        'filenameunique'  => $this->input->post('filenameunique'),
        'filenamealias'    => $this->input->post('filenamealias'),
        'uploadtimestamp' => date('Y-m-d H:i:s'),
        'ownerid'         => $this->input->post('invoiceowner'),
        'uploaderid'      => $this->session->userdata('id'),
        'notes'           => $this->input->post('invoicenotes')
      );
      $this->load->model('flowsessions_model');
      $this->flowsessions_model->add($data);
    }
  }

  public function getFlowSessions() {
    $accountType = $this->session->userdata('type');
    $this->load->model('flowsessions_model');

    $condition = array();
    if ($accountType == 'customer') {
      $condition = array('field' => 'ownerid', 'value' => $this->session->userdata('id'));
    }
    if ($accountType == 'consultant') {
      $condition = array('field' => 'uploaderid', 'value' => $this->session->userdata('id'));
    }
    $flowsessions = $this->flowsessions_model->getFlowSessions($condition);

    if (sizeof($flowsessions) > 0) {
      echo json_encode($flowsessions);
    }
    else {
      echo '';
    }
  }

  /**
  * Logging out
  */
  public function logout() {
    $this->session->sess_destroy();
    // Redirect to public main page
    redirect();
  }

}