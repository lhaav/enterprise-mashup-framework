<?php

/**
 * User account operations
 */
class Account_model extends CI_Model {

  public function Account_model() {
    parent::__construct();
    // Database table names
    $this->config->load('tables');
    $this->load->helper('database_helper');
  }
  
  /**
   * Registered account activation
   * 
   * @param  string $activationcode activation code sent to user
   * @return boolean true, if activation was successful, false otherwise            
   */
  public function activate($activationcode) {
    $email = $this->getUserEmail($activationcode);

    if (!$this->isAccountAvailable($email))
      return false;

    $data = array(
      'activated' => '1'
    );

    $this->db->where('activationcode', $activationcode);
    $this->db->limit(1);
    $this->db->update(table('users_table'), $data); 

    if ($this->db->affected_rows() == 1) {
      return true;
    }
    return false;    
  }
  
  /**
   * Verify if email is available
   * 
   * @param  string  $email email (which is the username)
   * @return boolean true, if account is available or not activated, false otherwise
   */
  public function isAccountAvailable($email) {
    $this->db->where('email', $email);
    $this->db->where('activated', '1');

    if ($this->db->count_all_results(table('users_table')) > 0) {
      return false;
    }
    return true;
  }

  /**
   * Verify if login is successful
   * 
   * @param  string $email    email (which is the username)
   * @param  string $password  password (sha1 hash)
   * @return boolean true, if login was successful, false otherwise
   */
  public function checkLoginData($email, $password)  {
    $this->db->where('email', $email);
    $this->db->where('password', $password);
    $this->db->where('activated', '1');

    if ($this->db->count_all_results(table('users_table')) == 0) {
      return false;
    }
    return true;
  }

  /**
   * Returns userID by email address
   * 
   * @param  string $email  email address (which is the username)
   * @return int            User ID
   */
  public function getUserID($email) {
    $this->db->select('id');
    $this->db->where('email', $email);
    $this->db->where('activated', '1');
    $this->db->limit(1);

    $query = $this->db->get(table('users_table'));
    $rows  = $query->result();
    
    if (sizeof($rows) == 0) {
      return false;  
    }
    return $rows[0]->id;
  }

  /**
   * Returns user email address by activation code
   * 
   * @param  string  $activationcode  activation code
   * @return string                   e-mail
   */
  public function getUserEmail($activationcode) {
    $this->db->select('email');
    $this->db->where('activationcode', $activationcode);
    $this->db->where('activated', '0');
    $this->db->limit(1);

    $query = $this->db->get(table('users_table'));
    $rows  = $query->result();
    
    if(sizeof($rows) == 0) {
      return false;  
    }
    return $rows[0]->email;
  }
  
  /**
   * Returns user type by id
   * 
   * @param  string  $id  UserID
   * @return string       Type
   */
  public function getUserType($userID) {
    $this->db->select('type');
    $this->db->where('id', $userID);
    $this->db->limit(1);

    $query = $this->db->get(table('users_table'));
    $rows  = $query->result();
    
    if(sizeof($rows) == 0) {
      return false;  
    }
    return $rows[0]->type;
  }

  /**
   * Returns users by account type
   * 
   * @param  string $type Account type
   * @return array        User emails with unique id
   */
  public function getUsersByType($type) {
    $this->db->select('id, email');
    $this->db->where('type', $type);

    $query = $this->db->get(table('users_table'));
    $rows  = $query->result();
    
    if (sizeof($rows) == 0) {
      return false;  
    }
    return $rows;
  }

  /**
   * Adding registration data into database
   * 
   * @param  array $data  email, password (sha1), registrationtimestamp, activationcode  
   * @return void
   */
  public function register($data) {
    $this->db->insert(table('users_table'), $data);
  }
    
  /**
   * Logging login and logout actions
   * 
   * @param  int  $userid User ID who logged in
   * @return void
   */
  public function log($userid) {
    $timestamp = date('Y-m-d H:i:s');

    $data = array(
      'userid' => $userid,
      'logintimestamp' => $timestamp 
    );
    $this->db->insert(table('logs_table'), $data);
  }
  
}